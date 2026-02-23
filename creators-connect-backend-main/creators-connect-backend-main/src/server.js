// import dotenv from "dotenv";
// dotenv.config();
import express from "express";
import "dotenv/config"
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import assetRoutes from "./routes/assestRoute.js";
import { createServer } from "http";
import { Server } from "socket.io";

// console.log("EMAIL_USER:", process.env.EMAIL_USER);
// console.log("EMAIL_PASS:", process.env.EMAIL_PASS);


connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["https://creators-connect-frontend.vercel.app", "http://localhost:5173"],
    credentials: true
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: ["https://creators-connect-frontend.vercel.app", "http://localhost:5173"],
  credentials: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);

// Socket.io for Chat Room
const activeUsers = new Map();
const chatRooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins with their user info
  socket.on("join", (userData) => {
    activeUsers.set(socket.id, {
      ...userData,
      socketId: socket.id
    });

    // Notify others that user is online
    socket.broadcast.emit("userOnline", {
      userId: userData.id,
      name: userData.name
    });
  });

  // Join a specific chat room
  socket.on("joinRoom", ({ roomId, user }) => {
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!chatRooms.has(roomId)) {
      chatRooms.set(roomId, {
        messages: [],
        users: []
      });
    }

    const room = chatRooms.get(roomId);
    room.users.push({ id: user.id, name: user.name, socketId: socket.id });

    // Notify room members
    io.to(roomId).emit("roomUsers", {
      roomId,
      users: room.users
    });

    // Send previous messages to the user who just joined
    socket.emit("previousMessages", room.messages);

    // Notify user joined
    socket.to(roomId).emit("message", {
      text: `${user.name} has joined the chat`,
      sender: { name: "System" },
      timestamp: new Date().toISOString(),
      isSystem: true
    });
  });

  // Leave a chat room
  socket.on("leaveRoom", ({ roomId, user }) => {
    socket.leave(roomId);

    if (chatRooms.has(roomId)) {
      const room = chatRooms.get(roomId);
      room.users = room.users.filter(u => u.socketId !== socket.id);

      io.to(roomId).emit("roomUsers", {
        roomId,
        users: room.users
      });

      // Notify others
      socket.to(roomId).emit("message", {
        text: `${user.name} has left the chat`,
        sender: { name: "System" },
        timestamp: new Date().toISOString(),
        isSystem: true
      });
    }
  });

  // Send message to a room
  socket.on("sendMessage", ({ roomId, message, sender }) => {
    const messageData = {
      text: message,
      sender: { id: sender.id, name: sender.name },
      timestamp: new Date().toISOString(),
      isSystem: false
    };

    // Save message to room history
    if (chatRooms.has(roomId)) {
      const room = chatRooms.get(roomId);
      room.messages.push(messageData);
      // Keep only last 100 messages
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
      }
    }

    // Broadcast to room
    io.to(roomId).emit("message", messageData);
  });

  // Create a new room
  socket.on("createRoom", ({ roomName, user }) => {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    chatRooms.set(roomId, {
      name: roomName,
      messages: [],
      users: [],
      createdBy: user.id,
      createdAt: new Date().toISOString()
    });

    // Notify all users about new room
    io.emit("roomCreated", {
      roomId,
      name: roomName,
      createdBy: user.name
    });

    socket.emit("roomCreatedSuccess", { roomId, name: roomName });
  });

  // Get all available rooms
  socket.on("getRooms", () => {
    const rooms = [];
    chatRooms.forEach((room, id) => {
      rooms.push({
        id,
        name: room.name,
        userCount: room.users.length,
        createdAt: room.createdAt
      });
    });
    socket.emit("roomsList", rooms);
  });

  // Typing indicator
  socket.on("typing", ({ roomId, user }) => {
    socket.to(roomId).emit("userTyping", { user });
  });

  socket.on("stopTyping", ({ roomId, user }) => {
    socket.to(roomId).emit("userStoppedTyping", { user });
  });

  // Get online users
  socket.on("getOnlineUsers", () => {
    const users = [];
    activeUsers.forEach((user) => {
      users.push({ id: user.id, name: user.name });
    });
    socket.emit("onlineUsers", users);
  });

  // Disconnect
  socket.on("disconnect", () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      // Notify others that user is offline
      socket.broadcast.emit("userOffline", {
        userId: user.id,
        name: user.name
      });

      // Remove from all rooms
      chatRooms.forEach((room, roomId) => {
        const userInRoom = room.users.find(u => u.socketId === socket.id);
        if (userInRoom) {
          room.users = room.users.filter(u => u.socketId !== socket.id);
          io.to(roomId).emit("roomUsers", {
            roomId,
            users: room.users
          });
          io.to(roomId).emit("message", {
            text: `${user.name} has disconnected`,
            sender: { name: "System" },
            timestamp: new Date().toISOString(),
            isSystem: true
          });
        }
      });

      activeUsers.delete(socket.id);
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
