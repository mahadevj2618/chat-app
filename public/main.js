const socket = io()

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

function sendMessage() {
  if (!messageInput.value.trim()) return // prevent empty messages

  const data = {
    name: nameInput.value,
    message: messageInput.value,
    dataTime: new Date(),
  }

  socket.emit('message', data)
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


