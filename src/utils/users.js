const users = [];

const addUser = ({id, username, room}) => {
   username = username.trim().toLowerCase();
   room = room.trim().toLowerCase();

   if (!username || !room)
      return {
         error: 'Username and room cannot be empty.',
      };

   const existingUser = users.find((user) => {
      return (
         username === user.username &&
         room === user.room
      );
   });
   if (existingUser)
      return {error: 'Username already exists!'};

   const user = {id, username, room};
   users.push(user);

   return {user};
};

const removeUser = (id) => {
   const index = users.findIndex(
      (user) => user.id === id
   ); 


   if (index !== -1) {
      
      return users.splice(index, 1)[0]; 
   }
};

const getUser = (id) => {
   return users.find((user) => user.id === id);
};

const getUsersInRoom = (room) => {
   return users.filter(
      (user) => user.room === room
   );
};

module.exports = {
   removeUser,
   addUser,
   getUser,
   getUsersInRoom,
};
