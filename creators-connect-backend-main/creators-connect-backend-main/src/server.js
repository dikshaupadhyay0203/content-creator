// import dotenv from "dotenv";
// dotenv.config();
import express from "express";
import "dotenv/config"
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import assetRoutes from "./routes/assestRoute.js";
import chatRoutes from "./routes/chatRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { saveMessageService } from "./services/chatService.js";
// Import chat controller
import * as chatController from "./controllers/chatController.js";

connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://creators-connect-frontend.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket"]
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use(cors({
  origin: ["https://creators-connect-frontend.vercel.app", "http://localhost:5173"],
  credentials: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/chat", chatRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user join
  socket.on("join", (userData) => {
    console.log("User joined:", userData);
    const users = chatController.handleJoin(socket, userData);

    socket.broadcast.emit("userOnline", {
      userId: userData.id,
      name: userData.name
    });

    socket.emit("onlineUsers", users);
  });

  // Handle joining a chat room
  socket.on("joinRoom", ({ roomId, roomName, user }) => {
    console.log("User joining room:", roomId, user.name);

    const { room, messages } = chatController.handleJoinRoom(socket, io, { roomId, roomName, user });

    socket.emit("previousMessages", messages);
    io.to(roomId).emit("roomUsers", room.users);

    console.log("Room users after join:", room.users);
  });

  // Handle leaving a chat room
  socket.on("leaveRoom", ({ roomId, user }) => {
    console.log("User leaving room:", roomId, user.name);
    chatController.handleLeaveRoom(socket, io, { roomId, user });
    const roomUsers = chatController.handleGetRoomUsers(roomId);
    io.to(roomId).emit("roomUsers", roomUsers);
  });

  // Handle sending a message in a room
  socket.on("sendMessage", ({ roomId, message, sender }) => {
    console.log("Sending message to room:", roomId, "message:", message);

    const messageData = chatController.handleSendMessage(socket, io, { roomId, message, sender });

    if (messageData) {
      console.log("Message emitted to room:", roomId);
    } else {
      console.log("User not found for socket:", socket.id);
    }
  });

  // Handle sending a direct message
  socket.on("sendDirectMessage", async ({ roomId, message, sender }) => {

    console.log("Saving DM to DB:", message);

    const fallbackMessage = {
      roomId,
      text: message,
      sender: {
        id: sender?.id,
        name: sender?.name
      },
      timestamp: new Date().toISOString()
    };

    try {

      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        io.to(roomId).emit("directMessage", fallbackMessage);
        console.log("DM emitted (in-memory room)");
        return;
      }

      const savedMessage = await saveMessageService({
        conversationId: roomId,
        sender: sender.id,
        text: message
      });

      io.to(roomId).emit("directMessage", {
        roomId,
        text: savedMessage.text,
        sender: {
          id: sender.id,
          name: sender.name
        },
        timestamp: savedMessage.createdAt
      });

      console.log("DM saved & emitted");

    } catch (err) {

      console.log("DB Save Error:", err.message);
      io.to(roomId).emit("directMessage", fallbackMessage);
      console.log("DM emitted after DB fallback");

    }

  });
  // Handle creating a new room
  socket.on("createRoom", ({ roomName, user }) => {
    console.log("Creating room:", roomName, "by:", user);
    chatController.handleCreateRoom(socket, io, { roomName, user });
  });

  // Handle getting all rooms
  socket.on("getRooms", () => {
    const rooms = chatController.handleGetRooms();
    socket.emit("roomsList", rooms);
  });

  // Handle typing indicator
  socket.on("typing", ({ roomId, user }) => {
    chatController.handleTyping(socket, io, { roomId, user });
  });

  // Handle stop typing indicator
  socket.on("stopTyping", ({ roomId, user }) => {
    chatController.handleStopTyping(socket, io, { roomId, user });
  });

  // Handle getting online users
  socket.on("getOnlineUsers", () => {
    const users = chatController.handleGetOnlineUsers();
    socket.emit("onlineUsers", users);
  });

  // Handle starting a direct message conversation
  socket.on("startDirectMessage", ({ currentUser, targetUser }) => {
    console.log("Starting direct message:", currentUser.name, "with", targetUser.name);
    chatController.handleStartDirectMessage(socket, io, { currentUser, targetUser });
  });

  // Handle getting users in a specific room
  socket.on("getRoomUsers", (roomId) => {
    const users = chatController.handleGetRoomUsers(roomId);
    socket.emit("roomUsers", users);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const user = chatController.handleDisconnect(socket);

    if (user) {
      socket.broadcast.emit("userOffline", {
        userId: user.id,
        name: user.name
      });
    }
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
