const express = require('express')

const path = require('path')
const app = express()
const PORT = 8080
app.use(express.static(path.join(__dirname, 'public')))


const server = app.listen(PORT, () => {
    console.log(`server on port ${PORT}`)
})

const io = require('socket.io')(server)

let socketsConected = new Set()

io.on('connection', onConnected)


function onConnected(socket) {
    socketsConected.add(socket.id)

    io.emit('clients-total', socketsConected.size)
    socket.on('disconnect', () => {
        socketsConected.delete(socket.id)
        io.emit('clients-total', socketsConected.size)
        
    })

    socket.on('message',(data)=>{
        socket.broadcast.emit('chat-message',data)
    })

    socket.on('feedback',(data)=>{
        socket.broadcast.emit('feedback',data)
    })
}