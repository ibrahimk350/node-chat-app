const socket = io()

//Elements
const messageForm = document.querySelector('#message-form')
const messageFormInput = messageForm.querySelector('input')
const messageFormButton = messageForm.querySelector('button')
const locationFormButton = document.querySelector('#send-location')
const messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const newMessage = messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = messages.offsetHeight
    
    // Height of Messages Container
    const containerHeight = messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

//Message Listener
socket.on('message', (message) => {
     console.log(message)
     const html = Mustache.render(messageTemplate, {
         username: message.username,
         message: message.text,
         createdAt: moment(message.createdAt).format('h:mm a')
     })
     messages.insertAdjacentHTML('beforeend', html)
     autoscroll()

})

//Location Message Listener
socket.on('locationMessage', (messageURL) => {
    console.log(messageURL)
    const html = Mustache.render(locationMessageTemplate, {
        username: messageURL.username,
        url: messageURL.url,
        createdAt: moment(messageURL.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//Room Data Listener
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    messageFormButton.setAttribute('disabled', 'disabled')

    const messageInput = e.target.elements.message
    const message = messageInput.value
    socket.emit('sendMessage', message, (error) => {

        messageFormButton.removeAttribute('disabled')
        messageFormInput.value = ""
        messageFormInput.focus()

        if(error) {
            return console.log(error)
        }

        console.log('Message Delivered!')
    })
})

locationFormButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    locationFormButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation', location, () => {
            locationFormButton.removeAttribute('disabled')

            console.log('Location Shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})