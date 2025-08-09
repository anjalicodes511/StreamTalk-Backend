const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socketio = require("socket.io");
const socketIo = require("./socket");
const userRouter = require("./routes/userRoutes");
const groupRouter = require("./routes/groupRoutes");
const messageRouter = require("./routes/messageRoutes");


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    // origin: ["https://streamtalk-frontend.onrender.com"], // Your frontend URL],
    origin: [
      "http://localhost:5173", // Local development
      "https://your-netlify-app.netlify.app", // Replace with your actual Netlify domain
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middlewares
app.use(cors());
app.use(express.json());

// Connect to database
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("Mongodb connection failed", err);
  });

// Initiaize socket
socketIo(io);
app.get("/", (req, res) => {
  res.json({
    project: "MERN Chat App using Socket.IO",
    message: "Welcome to MERN Chat Application",
    developedBy: "Anjali",
  });
});

// Include  routes
app.use("/api/users", userRouter);
app.use("/api/groups", groupRouter);
app.use("/api/messages", messageRouter);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}`);
});
