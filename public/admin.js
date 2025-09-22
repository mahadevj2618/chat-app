const socket = io('/mchat')

// Elements
const onlineCounter = document.getElementById('admin-online')
const messageContainer = document.getElementById('admin-message-container')
const messageForm = document.getElementById('admin-message-form')
const messageInput = document.getElementById('admin-message-input')
const usersList = document.getElementById('admin-users-list')

const kickBtn = document.getElementById('kick-user')
const muteBtn = document.getElementById('mute-user')
const deleteBtn = document.getElementById('delete-user')
const broadcastBtn = document.getElementById('broadcast-msg')

// Track selected user for admin actions
let selectedUser = null
let selectedUserId = null

// Fetch all users and display in sidebar
async function fetchUsers() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/auth/user', {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    })
    const data = await res.json()
    if (data.status === 'success') {
      renderUsers(data.data)
    }
  } catch (err) {
    console.error('Error fetching users:', err)
  }
}

function renderUsers(users) {
  usersList.innerHTML = ''
  users.forEach((user) => {
    const li = document.createElement('li')
    li.className = 'flex items-center justify-between gap-2 p-1 hover:bg-gray-700 rounded cursor-pointer'
    li.innerHTML = `
      <span class="flex items-center gap-2">
        <span class="w-2 h-2 ${user.online ? 'bg-green-400' : 'bg-gray-400'} rounded-full"></span> 
        ${user.user_name}
      </span>
      <input type="radio" name="selected-user" value="${user.user_name}" data-user-id="${user._id}" />
    `
    li.querySelector('input').addEventListener('change', () => {
      selectedUser = user.user_name
      selectedUserId = user._id
    })
    usersList.appendChild(li)
  })
}

// Socket events
// register this socket as admin after connected
socket.on('connect', () => {
  socket.emit('register-admin')
})
socket.on('clients-total', (data) => {
  onlineCounter.innerText = `🟢 Online: ${data}`
})

// reflect online users by name (green dot) in the admin list if present
socket.on('online-users', (names) => {
  if (!Array.isArray(names)) return
  const items = usersList.querySelectorAll('li')
  items.forEach((li) => {
    const nameEl = li.querySelector('span:nth-child(2)')
    const dot = li.querySelector('span:first-child')
    const name = nameEl ? nameEl.textContent.trim() : ''
    if (dot) {
      dot.className = `w-2 h-2 ${names.includes(name) ? 'bg-green-400' : 'bg-gray-400'} rounded-full`
    }
  })
})

socket.on('chat-message', (data) => {
  addMessageToUI(false, data)
})

// Monitor DM lifecycle
socket.on('dm-start-monitor', ({ roomId, participants }) => {
  addMessageToUI(false, { name: 'System', message: `DM started between ${participants.join(' ↔ ')}`, dataTime: new Date() })
})

socket.on('dm-monitor', ({ roomId, message, fromName, participants, dataTime }) => {
  addMessageToUI(false, { name: `DM ${participants.join('↔')} | ${fromName}`, message, dataTime })
})

// Send chat message (admin)
messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  sendMessage()
})

function sendMessage() {
  if (!messageInput.value.trim()) return

  const data = {
    name: 'Admin',
    message: messageInput.value,
    dataTime: new Date(),
  }

  socket.emit('message', data)
  addMessageToUI(true, data)
  messageInput.value = ''
}

// Add message to UI
function addMessageToUI(isOwnMessage, data) {
  const li = document.createElement('li')
  li.classList.add('flex', isOwnMessage ? 'justify-end' : 'justify-start')

  const p = document.createElement('p')
  p.className = `${
    isOwnMessage ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-100'
  } px-3 sm:px-4 py-2 rounded-lg max-w-[75%] text-sm sm:text-base`

  p.innerHTML = `
    ${data.message}
    <span class="block text-xs ${isOwnMessage ? 'text-gray-200' : 'text-gray-400'} mt-1">
      ${data.name} ● ${moment(data.dataTime).fromNow()}
    </span>
  `

  li.appendChild(p)
  messageContainer.appendChild(li)
  messageContainer.scrollTop = messageContainer.scrollHeight
}

// Admin actions
kickBtn.addEventListener('click', () => {
  if (!selectedUser) return alert('Select a user first!')
  socket.emit('admin-action', { type: 'kick', user: selectedUser })
  alert(`${selectedUser} has been kicked`)
})

muteBtn.addEventListener('click', () => {
  if (!selectedUser) return alert('Select a user first!')
  socket.emit('admin-action', { type: 'mute', user: selectedUser })
  alert(`${selectedUser} has been muted`)
})

broadcastBtn.addEventListener('click', () => {
  const message = prompt('Enter broadcast message:')
  if (!message) return
  socket.emit('admin-action', { type: 'broadcast', message })
  addMessageToUI(true, { name: 'Admin', message, dataTime: new Date() })
})

deleteBtn.addEventListener('click', async () => {
  if (!selectedUser || !selectedUserId) return alert('Select a user first!')
  
  const confirmDelete = confirm(`Are you sure you want to DELETE user "${selectedUser}"? This action cannot be undone!`)
  if (!confirmDelete) return
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/auth/admin/user/${selectedUserId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    
    if (result.status === 'success') {
      alert(`User "${selectedUser}" has been deleted successfully`)
      // Refresh the users list
      fetchUsers()
      // Clear selection
      selectedUser = null
      selectedUserId = null
      // Uncheck all radio buttons
      document.querySelectorAll('input[name="selected-user"]').forEach(radio => {
        radio.checked = false
      })
    } else {
      alert(`Failed to delete user: ${result.message}`)
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    alert('Error deleting user. Please try again.')
  }
})

// Fetch users initially
fetchUsers()

// Auto-load persisted messages (admin-only endpoints)
(async function loadLogs() {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    const [pubRes, dmRes] = await Promise.all([
      fetch('/api/auth/admin/messages/public', { headers: { 'Authorization': 'Bearer ' + token }}),
      fetch('/api/auth/admin/messages/direct', { headers: { 'Authorization': 'Bearer ' + token }})
    ])
    const pub = await pubRes.json()
    const dm = await dmRes.json()
    if (pub.status === 'success') {
      pub.data.reverse().forEach(row => addMessageToUI(false, { name: row.sender_name, message: `[LOG] ${row.message_text}`, dataTime: row.sent_at }))
    }
    if (dm.status === 'success') {
      dm.data.reverse().forEach(row => addMessageToUI(false, { name: `DM ${row.from_name}↔${row.to_name} | ${row.from_name}`, message: `[LOG] ${row.message_text}`, dataTime: row.sent_at }))
    }
  } catch (e) {
    console.error('Failed to load logs', e)
  }
})()
