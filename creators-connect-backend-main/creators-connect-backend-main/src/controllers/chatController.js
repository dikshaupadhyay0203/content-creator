import {
    getConversation as getConversationService,
    getMessages as getMessagesService,
    createConversation as createConversationService,
    sendMessage as sendMessageService
} from "../services/chatService.js";

// In-memory storage for socket handlers
const activeUsers = new Map();
const chatRooms = new Map();

const uniqueUsersById = (users = []) => {
    const seen = new Set();
    return users.filter((roomUser) => {
        const userId = String(roomUser?.id || "");
        if (!userId || seen.has(userId)) {
            return false;
        }
        seen.add(userId);
        return true;
    });
};

export const handleJoin = (socket, userData) => {
    console.log("Handling join:", userData);
    activeUsers.set(socket.id, {
        ...userData,
        socketId: socket.id
    });

    const users = [];
    activeUsers.forEach((user) => {
        users.push({ id: user.id, name: user.name });
    });

    return users;
};

export const handleJoinRoom = (socket, io, { roomId, roomName, user }) => {
    console.log("Handling joinRoom:", roomId, user.name);
    socket.join(roomId);

    if (!chatRooms.has(roomId)) {
        chatRooms.set(roomId, {
            name: roomName || roomId,
            messages: [],
            users: [],
            createdAt: new Date().toISOString()
        });
    }

    const room = chatRooms.get(roomId);

    if (roomName && (!room.name || room.name === "Direct Message" || room.name === roomId)) {
        room.name = roomName;
    }

    const existingUser = room.users.find((roomUser) => String(roomUser.id) === String(user.id));
    if (existingUser) {
        existingUser.socketId = socket.id;
        existingUser.name = user.name;
    } else {
        room.users.push({ id: user.id, name: user.name, socketId: socket.id });
    }

    return { room, messages: room.messages };
};

export const handleLeaveRoom = (socket, io, { roomId, user }) => {
    console.log("Handling leaveRoom:", roomId, user.name);
    socket.leave(roomId);

    if (chatRooms.has(roomId)) {
        const room = chatRooms.get(roomId);
        room.users = room.users.filter(u => u.socketId !== socket.id);
    }
};

export const handleSendMessage = (socket, io, { roomId, message, sender }) => {
    console.log("Handling sendMessage:", roomId, message);

    const messageData = {
        roomId,
        text: message,
        sender: sender,
        timestamp: new Date().toISOString(),
        isSystem: false
    };

    if (chatRooms.has(roomId)) {
        const room = chatRooms.get(roomId);
        room.messages.push(messageData);

        // Keep only last 100 messages
        if (room.messages.length > 100) {
            room.messages = room.messages.slice(-100);
        }
    }

    io.to(roomId).emit("message", messageData);

    return messageData;
};

export const handleCreateRoom = (socket, io, { roomName, user }) => {
    console.log("Handling createRoom:", roomName);
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    chatRooms.set(roomId, {
        name: roomName,
        messages: [],
        users: [],
        createdBy: user.id,
        createdAt: new Date().toISOString()
    });

    io.emit("roomCreated", {
        roomId,
        name: roomName,
        createdBy: user.name
    });

    socket.emit("roomCreatedSuccess", { roomId, name: roomName });
};

export const handleGetRooms = () => {
    const rooms = [];
    chatRooms.forEach((room, id) => {
        const uniqueUsers = uniqueUsersById(room.users);
        rooms.push({
            id,
            name: room.name,
            userCount: uniqueUsers.length,
            createdAt: room.createdAt
        });
    });
    return rooms;
};

export const handleTyping = (socket, io, { roomId, user }) => {
    socket.to(roomId).emit("userTyping", { roomId, user });
};

export const handleStopTyping = (socket, io, { roomId, user }) => {
    socket.to(roomId).emit("userStoppedTyping", { roomId, user });
};

export const handleGetOnlineUsers = () => {
    const users = [];
    activeUsers.forEach((user) => {
        users.push({ id: user.id, name: user.name });
    });
    return users;
};

export const handleStartDirectMessage = (socket, io, { currentUser, targetUser }) => {
    console.log("Handling startDirectMessage:", currentUser.name, "with", targetUser.name);

    // Create a unique room ID based on both user IDs (sorted to ensure consistency)
    const roomId = [currentUser.id, targetUser.id].sort().join("_dm_");

    // Create or get the room
    if (!chatRooms.has(roomId)) {
        chatRooms.set(roomId, {
            name: `${currentUser.name} & ${targetUser.name}`,
            messages: [],
            users: [],
            isDirect: true,
            participants: [currentUser, targetUser],
            createdAt: new Date().toISOString()
        });
        console.log("Created new DM room:", roomId);
    }

    const room = chatRooms.get(roomId);

    // Ensure metadata is correct even if room was implicitly created earlier via joinRoom
    room.name = `${currentUser.name} & ${targetUser.name}`;
    room.isDirect = true;
    room.participants = [currentUser, targetUser];
    room.createdAt = room.createdAt || new Date().toISOString();

    // Add both users to the room if not already present
    if (!room.users.find(u => u.id === currentUser.id)) {
        room.users.push({ id: currentUser.id, name: currentUser.name, socketId: socket.id });
    }

    // Join the socket to the room
    socket.join(roomId);

    // Join target user's active sockets to the room (if online)
    activeUsers.forEach((user, socketId) => {
        if (user.id === targetUser.id) {
            const targetSocket = io.sockets.sockets.get(socketId);
            if (targetSocket) {
                targetSocket.join(roomId);

                if (!room.users.find(u => String(u.id) === String(targetUser.id))) {
                    room.users.push({ id: targetUser.id, name: targetUser.name, socketId });
                }
            }
        }
    });

    // Send room info back to the sender
    socket.emit("directMessageRoomCreated", {
        roomId,
        participants: room.participants,
        messages: room.messages
    });

    // Notify the other user if they're online
    activeUsers.forEach((user, socketId) => {
        if (user.id === targetUser.id) {
            io.to(socketId).emit("newDirectMessage", {
                roomId,
                from: currentUser,
                messages: room.messages
            });
        }
    });
};

export const handleGetRoomUsers = (roomId) => {
    if (chatRooms.has(roomId)) {
        const room = chatRooms.get(roomId);
        return uniqueUsersById(room.users);
    }
    return [];
};

export const handleDisconnect = (socket) => {
    const user = activeUsers.get(socket.id);
    activeUsers.delete(socket.id);

    chatRooms.forEach((room) => {
        room.users = room.users.filter((roomUser) => roomUser.socketId !== socket.id);
    });

    return user;
};

// HTTP Route Handlers
export const createConversation = async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;
        if (!senderId || !receiverId) {
            return res.status(400).json({ success: false });
        }
        const conversation = await createConversationService(senderId, receiverId);
        res.status(200).json({ success: true, conversation });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

export const getConversation = async (req, res) => {
    try {
        const userId = req.user?._id || req.query.userId;
        if (!userId) {
            return res.status(400).json({ success: false });
        }
        const conversations = await getConversationService(userId);
        res.status(200).json({ success: true, conversations });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        if (!conversationId) {
            return res.status(400).json({ success: false });
        }
        const messages = await getMessagesService(conversationId);
        res.status(200).json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { conversationId, senderId, receiverId, text } = req.body;
        if (!conversationId || !senderId || !receiverId || !text) {
            return res.status(400).json({ success: false });
        }
        const message = await sendMessageService(conversationId, senderId, receiverId, text);
        res.status(200).json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

export const sendMediaMessage = async (req, res) => {
    try {
        const { conversationId, senderId, receiverId, text } = req.body;

        if (!conversationId || !senderId || !receiverId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const message = await import("../services/chatService.js").then(m => m.sendMediaMessage(
            req.file,
            conversationId,
            senderId,
            receiverId,
            text
        ));

        res.status(200).json({ success: true, message });
    } catch (error) {
        console.error("sendMediaMessage error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
