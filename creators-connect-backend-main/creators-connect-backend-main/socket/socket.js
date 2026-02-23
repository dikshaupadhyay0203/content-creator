import { Server } from "socket.io";

let io;
const userSockets = {}; // {userId: [socketId1, socketId2]}

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        const userId = socket.handshake.query.userId;
        if (userId && userId !== "undefined") {
            if (!userSockets[userId]) userSockets[userId] = [];
            userSockets[userId].push(socket.id);
        }

        // io.emit() is used to send events to all the connected clients
        io.emit("getOnlineUsers", Object.keys(userSockets));

        socket.on("join", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined room`);
        });

        socket.on("typing", ({ senderId, receiverId }) => {
            socket.to(receiverId).emit("typing", { senderId });
        });

        socket.on("sendMessage", (messageData) => {
            const { receiver } = messageData;

            if (receiver) {
                socket.to(receiver).emit("receiveMessage", messageData);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            if (userId && userId !== "undefined" && userSockets[userId]) {
                userSockets[userId] = userSockets[userId].filter(id => id !== socket.id);
                if (userSockets[userId].length === 0) {
                    delete userSockets[userId];
                }
            }
            io.emit("getOnlineUsers", Object.keys(userSockets));
        });
    });

    return io;
};