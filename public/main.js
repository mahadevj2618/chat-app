const socket = io('/mchat')

const c_total = document.getElementById('onlineChat')
const messageContainer = document.getElementById('message-container')
const nameInput = document.getElementById('name-input')
const messageForm = document.getElementById('message-form')
const messageInput = document.getElementById('message-input')

messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  sendMessage()
})

socket.on('clients-total', (data) => {
  c_total.innerText = `🟢 Online: ${data}`
})

// get list of online users (by display name)
socket.on('online-users', (names) => {
  // update users list to reflect online/green only for those names
  if (!Array.isArray(names)) return
  const items = usersList.querySelectorAll('li')
  items.forEach((li) => {
    const name = li.textContent.trim()
    const dot = li.querySelector('span')
    if (dot) {
      dot.className = `w-2 h-2 rounded-full ${names.includes(name) ? 'bg-green-400' : 'bg-gray-400'}`
    }
  })
})

function sendMessage() {
  if (!messageInput.value.trim()) return // prevent empty messages

  const dmActive = currentDM && currentDM.roomId
  const data = {
    name: dmActive ? `[DM to ${currentDM.with}] ${nameInput.value}` : nameInput.value,
    message: messageInput.value,
    dataTime: new Date(),
  }

  if (dmActive) {
    socket.emit('dm-message', { roomId: currentDM.roomId, message: messageInput.value, fromName: nameInput.value, dataTime: data.dataTime })
  } else {
    socket.emit('message', data)
  }
  addMessageToUI(true, data)
  messageInput.value = ''
}

socket.on('chat-message', (data) => {
  addMessageToUI(false, data)
})

function addMessageToUI(isOwnMessage, data) {
    clearFeedback()
  // wrapper <li>
  const li = document.createElement('li')
  li.classList.add('flex', isOwnMessage ? 'justify-end' : 'justify-start')

  // message bubble
  const p = document.createElement('p')
  p.className = `${
    isOwnMessage
      ? 'bg-blue-600 text-white'
      : 'bg-gray-700 text-gray-100'
  } px-3 sm:px-4 py-2 rounded-lg max-w-[75%] text-sm sm:text-base`

  p.innerHTML = `
    ${data.message}
    <span class="block text-xs ${
      isOwnMessage ? 'text-gray-200' : 'text-gray-400'
    } mt-1">
      ${data.name} ● ${moment(data.dataTime).fromNow()}
    </span>
  `

  li.appendChild(p)
  messageContainer.appendChild(li)

  // auto scroll to bottom
  messageContainer.scrollTop = messageContainer.scrollHeight
}

messageInput.addEventListener('focus',(e)=>{
    socket.emit('feedback',{
        feedback:`✍️${nameInput.value} is typing a message...`
    })
})

messageInput.addEventListener('keypress',(e)=>{
    socket.emit('feedback',{
        feedback:`✍️${nameInput.value} is typing a message...`
    })
})

messageInput.addEventListener('blur',(e)=>{
    socket.emit('feedback',{
        feedback:``
    })
})

socket.on('feedback', (data) => {
  clearFeedback()
  const element = `
    <li class="feedback-msg flex justify-start">
      <p class="italic text-gray-400 text-sm">${data.feedback}</p>
    </li>`
  messageContainer.insertAdjacentHTML('beforeend', element)
  messageContainer.scrollTop = messageContainer.scrollHeight
})

function clearFeedback() {
  document.querySelectorAll('.feedback-msg').forEach((el) => el.remove())
}



const usersList = document.getElementById('users-list')
let currentDM = null // { roomId, with }

// fetch all users on load
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
    li.className = 'flex items-center gap-2 justify-between'
    li.innerHTML = `<span class="flex items-center gap-2"><span class="w-2 h-2 bg-gray-400 rounded-full"></span> ${user.user_name}</span>
    <button class="text-xs bg-blue-600 text-white px-2 py-1 rounded dm-btn">DM</button>`
    li.querySelector('.dm-btn').addEventListener('click', () => {
      const toName = user.user_name
      if (!toName || toName === nameInput.value) return
      socket.emit('dm-request', { toName })
      alert(`DM request sent to ${toName}`)
    })
    usersList.appendChild(li)
  })
}

// call it once when page loads
fetchUsers()

// announce my presence with name changes
function announceJoin() {
  const name = nameInput.value || 'anonymous'
  socket.emit('join', { name })
}
nameInput.addEventListener('change', announceJoin)
nameInput.addEventListener('blur', announceJoin)
// initial announce after short delay to ensure socket is ready
setTimeout(announceJoin, 300)

// DM flows
socket.on('dm-request', ({ fromName }) => {
  if (!fromName) return
  const accept = confirm(`${fromName} wants to chat privately. Accept?`)
  if (accept) {
    socket.emit('dm-accept', { fromName })
  }
})

socket.on('dm-start', ({ roomId, with: withName }) => {
  currentDM = { roomId, with: withName }
  alert(`Private chat started with ${withName}`)
})

socket.on('dm-message', ({ roomId, message, fromName, dataTime }) => {
  if (!message) return
  addMessageToUI(false, { name: `[DM] ${fromName}`, message, dataTime })
})
