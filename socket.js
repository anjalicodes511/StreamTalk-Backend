const socketIo = (io)=>{
    // Store all connected users with their room info using socket.id as key
    const connectedUsers = new Map();
    // Handle new socket connections
    io.on("connection", (socket) => {
        // Get user from authentication
        const user = socket.handshake.auth.user;
        //! START: Join room handler
        socket.on("join room", (groupId) => {
            // Add socket to specified room
            socket.join(groupId);
            // Store user and room info in connectedUsers map
            connectedUsers.set(socket.id, { user, room:groupId });
            // Get list of all users currently in room
            const usersInRoom = Array.from(connectedUsers.values()).filter((u)=>u.room === groupId).map((u)=>u.user);

            // Emit updated users list to all users in room
            io.in(groupId).emit("users in room", usersInRoom);
            // Broadcast notification to all users in room
            socket.to(groupId).emit("notification", {
                type:"USER_JOINED",
                message:`${user?.username} has joined the group`,
                user: user
            });
        });
        //! END : Join room handler

        //! START: Leave room handler
        // Triggered when a user manually leaves a room
        socket.on("leave room", (groupId) => {
            // Remove socket from room
            socket.leave(groupId);
            if(connectedUsers.has(socket.id)){
                // Remove user and room info from connectedUsers map and notify ithers
                connectedUsers.delete(socket.id);
                socket.to(groupId).emit("user left", user?._id);
            }
        })
        //! END : Leave room handler

        //! START: New message handler
        // Triggered when a user sends a new message
        socket.on("new message", (message) => {
            // Broadcast message to all users in room
            socket.to(message.groupId).emit("message received", message);
        });
        //! END : New message handler

        //! START: Disconnect handler
        // Triggered when a user closes the socket connection
        socket.on("disconnect", () => {
            if(connectedUsers.has(socket.id)){
                // Get user's room info before removing
                const userData = connectedUsers.get(socket.id);
                // Notify others about user leaving
                socket.to(userData.room).emit("user left", user?._id);
                // Remove user and room info from connectedUsers map
                connectedUsers.delete(socket.id);
            }
        })
        //! END : Disconnect handler

        //! START: Typing indicator
        // Triggered when users starts typing
        socket.on("typing", ({groupId, username}) => {
            // Broadcast typing status to all users in room
            socket.to(groupId).emit("user typing", {username});
        });
        // Triggered when users stops typing
        socket.on("stop typing", ({groupId}) => {
            // Broadcast typing status to all users in room
            socket.to(groupId).emit("user stop typing", {username:user?.username});
        });
        //! END : Typing indicator
    })
}
module.exports = socketIo;