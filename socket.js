const Group = require("./models/GroupModel"); // Adjust path to your Group model

const socketIo = (io) => {
  // Store connected users with their room info
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    // Get authenticated user from handshake
    const user = socket.handshake.auth.user;

    //! ---------------- JOIN ROOM ----------------
    socket.on("join room", async (groupId) => {
      try {
        if (!user?._id) {
          socket.emit("error", "Unauthorized");
          return;
        }

        // Check if group exists
        const group = await Group.findById(groupId).select("members");
        if (!group) {
          socket.emit("error", "Group not found");
          return;
        }

        // Check membership
        const isMember = group.members.some(
          (memberId) => memberId.toString() === user._id
        );
        if (!isMember) {
          socket.emit("error", "You are not a member of this group");
          return;
        }

        // Join the room
        socket.join(groupId);
        connectedUsers.set(socket.id, { user, room: groupId });

        // Send updated user list
        const usersInRoom = Array.from(connectedUsers.values())
          .filter((u) => u.room === groupId)
          .map((u) => u.user);

        io.in(groupId).emit("users in room", usersInRoom);

        // Notify others in room
        socket.to(groupId).emit("notification", {
          type: "USER_JOINED",
          message: `${user?.username} has joined the group`,
          user: user,
        });

      } catch (err) {
        console.error("Join room error:", err);
        socket.emit("error", "Server error while joining group");
      }
    });

    //! ---------------- LEAVE ROOM ----------------
    socket.on("leave room", (groupId) => {
      socket.leave(groupId);
      if (connectedUsers.has(socket.id)) {
        connectedUsers.delete(socket.id);
        socket.to(groupId).emit("user left", user?._id);
      }
    });

    //! ---------------- NEW MESSAGE ----------------
    socket.on("new message", async (message) => {
      try {
        // Check if user is actually in this room before broadcasting
        const group = await Group.findById(message.groupId).select("members");
        if (!group) return;

        const isMember = group.members.some(
          (memberId) => memberId.toString() === user._id
        );
        if (!isMember) {
          socket.emit("error", "You cannot send messages to this group");
          return;
        }

        socket.to(message.groupId).emit("message received", message);
      } catch (err) {
        console.error("Message send error:", err);
      }
    });

    //! ---------------- DISCONNECT ----------------
    socket.on("disconnect", () => {
      if (connectedUsers.has(socket.id)) {
        const userData = connectedUsers.get(socket.id);
        socket.to(userData.room).emit("user left", user?._id);
        connectedUsers.delete(socket.id);
      }
    });

    //! ---------------- TYPING INDICATOR ----------------
    socket.on("typing", ({ groupId, username }) => {
      socket.to(groupId).emit("user typing", { username });
    });

    socket.on("stop typing", ({ groupId }) => {
      socket.to(groupId).emit("user stop typing", { username: user?.username });
    });
  });
};

module.exports = socketIo;
