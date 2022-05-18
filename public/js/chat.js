const socket = io();

//?Elements
const messageForm =
   document.querySelector('#input');
const messageFormInput =
   messageForm.querySelector('input');
const messageSendButton =
   messageForm.querySelector('button');
const locationButton = document.querySelector(
   '#send-location'
);
const messages =
   document.querySelector('#messages');

//?Templates
const messageTemplate = document.querySelector(
   '#message-template'
).innerHTML;

const locationTemplate = document.querySelector(
   '#location-url'
).innerHTML;
const sidebarTemplate = document.querySelector(
   '#sidebar-template'
).innerHTML;

//?Options
const {username, room} = Qs.parse(
   location.search,
   {
      ignoreQueryPrefix: true,
   }
);

const autoScroll = () => {
   //storing new message
   const newMessage = messages.lastElementChild;

   //Height of new message
   const newMessageStyles =
      getComputedStyle(newMessage);
   const newMessageMargin = parseInt(
      newMessageStyles.marginBottom
   );
   const newMessageHeight =
      newMessage.offsetHeight + newMessageMargin;

   //visible height
   const visibleHeight = messages.offsetHeight;

   //height of messages container
   const containerHeight = messages.scrollHeight;

   //how far did i scroll?
   const scrollOffset = Math.ceil(
      messages.scrollTop + visibleHeight
   );
   if (
      containerHeight - newMessageHeight <=
      scrollOffset
   ) {
      messages.scrollTop = messages.scrollHeight;
   }
};

socket.on('message', (message) => {
   console.log(message);
   const html = Mustache.render(messageTemplate, {
      username: message.username,
      message: message.text,
      createdAt: moment(message.createdAt).format(
         'H:mm'
      ),
   });
   messages.insertAdjacentHTML('beforeend', html);
   autoScroll();
});

socket.on('locationMessage', (message) => {
   console.log(message);
   const html = Mustache.render(
      locationTemplate,
      {
         username,
         url: message.url,
         createdAt: moment(
            message.createdAt
         ).format('H:mm'),
      }
   );
   messages.insertAdjacentHTML('beforeend', html);

   autoScroll();
});

socket.on('roomData', ({room, users}) => {
   const html = Mustache.render(sidebarTemplate, {
      room,
      users,
   });
   document.querySelector('#sidebar').innerHTML =
      html;
});

messageForm.addEventListener('submit', (e) => {
   e.preventDefault();
   const message = messageFormInput.value;

   messageSendButton.setAttribute(
      'disabled',
      'disabled'
   );
   socket.emit(
      'sendMessage',
      message,
      (error) => {
         messageSendButton.removeAttribute(
            'disabled'
         );
         messageFormInput.value = '';
         messageFormInput.focus();

         if (error) {
            return console.log(error);
         }
         console.log(
            'Message has been delivered.'
         );
      }
   );
});

locationButton.addEventListener('click', () => {
   if (!navigator.geolocation)
      return alert(
         `Your browser doesn't support this feature.`
      );

   locationButton.setAttribute(
      'disabled',
      'disabled'
   );

   navigator.geolocation.getCurrentPosition(
      (position) => {
         socket.emit(
            'sendLocation',
            {
               latitude: position.coords.latitude,
               longitude:
                  position.coords.longitude,
            },
            () => {
               locationButton.removeAttribute(
                  'disabled'
               );
               console.log('Location shared!');
            }
         );
      }
   );
});

socket.emit('join', {username, room}, (error) => {
   if (error) {
      alert(error);
      location.href = '/';
   }
});
