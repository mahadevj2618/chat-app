const express = require('express')

const path = require('path')
const app = express()
const PORT = 8080
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }))



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cors = require('cors');
app.use(cors());
const api = require('./routes/routes')
const auth=require('./middleware/auth')
app.use('/api', api)
require('dotenv').config();


app.get('/mchat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'))
})

const server = app.listen(PORT, () => {
    console.log(`server on port ${PORT}`)
})

const io = require('socket.io')(server)
const messageBL = require('./bl/messageBL')

let socketsConected = new Set()
const mutedUsers = new Set()
const socketIdToName = new Map()
const nameToSocketId = new Map()
const adminSocketIds = new Set()
const onlineNames = new Set()
cnsp = io.of('/mchat');

// ensure DB tables for messages exist
messageBL.ensureSchema().catch((e) => console.error('Schema init error:', e.message))

cnsp.on('connection', onConnected)


function onConnected(socket) {
    socketsConected.add(socket.id)

    cnsp.emit('clients-total', socketsConected.size)
    socket.on('disconnect', () => {
        socketsConected.delete(socket.id)
        const name = socketIdToName.get(socket.id)
        if (name) {
            socketIdToName.delete(socket.id)
            nameToSocketId.delete(name)
            onlineNames.delete(name)
            cnsp.emit('online-users', Array.from(onlineNames))
        }
        if (adminSocketIds.has(socket.id)) {
            adminSocketIds.delete(socket.id)
        }
        cnsp.emit('clients-total', socketsConected.size)

    })

    socket.on('message', (data) => {
        // if user is muted, drop message
        if (data && data.name && mutedUsers.has(data.name)) {
            return
        }
        // store public message
        try {
            messageBL.storePublicMessage({ senderName: data?.name || 'unknown', messageText: data?.message || '' })
        } catch (e) { /* already logged inside BL */ }
        socket.broadcast.emit('chat-message', data)
    })

    socket.on('feedback', (data) => {
        socket.broadcast.emit('feedback', data)
    })

    // basic admin actions
    socket.on('admin-action', (payload) => {
        if (!payload || !payload.type) return
        if (payload.type === 'broadcast' && payload.message) {
            cnsp.emit('chat-message', { name: 'Admin', message: payload.message, dataTime: new Date() })
        }
        if (payload.type === 'mute' && payload.user) {
            mutedUsers.add(payload.user)
        }
        if (payload.type === 'kick' && payload.user) {
            // naive: disconnect first socket we find (no username<->socket map in current app)
            for (const s of cnsp.sockets.values()) {
                if (s && s.handshake && s.handshake.auth && s.handshake.auth.name === payload.user) {
                    s.disconnect(true)
                    break
                }
            }
        }
    })

    // join with display name
    socket.on('join', (payload) => {
        if (!payload || !payload.name) return
        const prev = socketIdToName.get(socket.id)
        if (prev && prev !== payload.name) {
            onlineNames.delete(prev)
            nameToSocketId.delete(prev)
        }
        socketIdToName.set(socket.id, payload.name)
        nameToSocketId.set(payload.name, socket.id)
        onlineNames.add(payload.name)
        cnsp.emit('online-users', Array.from(onlineNames))
    })

    // mark this socket as admin (after HTTP verify on admin.html)
    socket.on('register-admin', () => {
        adminSocketIds.add(socket.id)
    })

    // direct message request
    socket.on('dm-request', ({ toName }) => {
        const fromName = socketIdToName.get(socket.id)
        if (!fromName || !toName || fromName === toName) return
        const targetId = nameToSocketId.get(toName)
        if (targetId) {
            cnsp.to(targetId).emit('dm-request', { fromName })
        }
    })

    // accept direct message request -> create room for both
    socket.on('dm-accept', ({ fromName }) => {
        const toName = socketIdToName.get(socket.id)
        if (!fromName || !toName) return
        const requesterId = nameToSocketId.get(fromName)
        if (!requesterId) return
        const roomId = [fromName, toName].sort().join('#')
        socket.join(roomId)
        cnsp.sockets.get(requesterId)?.join(roomId)
        cnsp.to([requesterId, socket.id]).emit('dm-start', { roomId, with: socketIdToName.get(requesterId) === toName ? fromName : toName })
        // inform admins
        for (const adminId of adminSocketIds) {
            cnsp.to(adminId).emit('dm-start-monitor', { roomId, participants: [fromName, toName] })
        }
    })

    // direct message send within room
    socket.on('dm-message', ({ roomId, message, fromName, dataTime }) => {
        if (!roomId || !message) return
        const payload = { roomId, message, fromName: fromName || socketIdToName.get(socket.id), dataTime: dataTime || new Date() }
        cnsp.to(roomId).emit('dm-message', payload)
        // mirror to admins
        const participants = roomId.split('#')
        // store DM
        try {
            messageBL.storeDirectMessage({ roomId, fromName: payload.fromName, toName: participants.find(n => n !== payload.fromName) || participants[0], messageText: message })
        } catch (e) { /* already logged inside BL */ }
        for (const adminId of adminSocketIds) {
            cnsp.to(adminId).emit('dm-monitor', { ...payload, participants })
        }
    })
}