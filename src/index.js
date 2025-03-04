const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const cors = require('cors');
const {
   generateMessage,
   locationMessage,
} = require('./utils/messages');

const {
   removeUser,
   addUser,
   getUser,
   getUsersInRoom,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
   cors: {
      origin: "*", // Allow all origins; change this if needed
      methods: ["GET", "POST"]
   }
});
const publicDirectory = path.join(__dirname, '../public');

const port = process.env.PORT || 3000;

app.use(express.static(publicDirectory));
app.use(cors());
io.on('connection', (socket) => {
   console.log('Connection has been established');

   socket.on(
      'sendMessage',
      (message, callback) => {
         const user = getUser(socket.id);

         const filter = new Filter();
         if (filter.isProfane(message))
            return callback(
               'Profane is not allowed!'
            );
         io.to(user.room).emit(
            'message',
            generateMessage(
               user.username,
               message
            )
         );
         callback();
      }
   );

   socket.on(
      'join',
      ({username, room}, callback) => {
         const {error, user} = addUser({
            id: socket.id,
            username,
            room,
         });

         if (error) {
            return callback(error);
         }

         socket.join(user.room);

         socket.emit(
            'message',
            generateMessage(
               'Admin',
               'Welcome to the chat app!'
            )
         );

         socket.broadcast
            .to(user.room)
            .emit(
               'message',
               generateMessage(
                  'Admin',
                  `${user.username} has joined!`
               )
            );

         io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
         });

         callback();
      }
   );

   socket.on(
      'sendLocation',
      (location, callback) => {
         const user = getUser(socket.id);
         io.to(user.room).emit(
            'locationMessage',
            locationMessage(
               user.username,
               `https://google.com/maps?q=${location.latitude},${location.longitude}`
            )
         );
         callback();
      }
   );
   socket.on('disconnect', () => {
      const user = removeUser(socket.id);

      if (user) {
         io.to(user.room).emit(
            'message',
            generateMessage(
               'Admin',
               `${user.username} has disconnected!`
            )
         );
         io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
         });
      }
   });
});

server.listen(port, () => {
   console.log(`Server started at port ${port}`);
});
