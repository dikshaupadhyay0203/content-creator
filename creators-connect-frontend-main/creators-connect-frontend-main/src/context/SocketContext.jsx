import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [directMessageRoom, setDirectMessageRoom] = useState(null);
    const [dmMessages, setDmMessages] = useState([]);
    const [dmParticipants, setDmParticipants] = useState([]);
    const { user } = useAuth();
    const socketRef = useRef(null);
    const getUserId = () => user?.id || user?._id;
    const emitWhenConnected = (eventName, payload) => {
        if (!socketRef.current) {
            return;
        }

        const activeSocket = socketRef.current;

        if (activeSocket.connected) {
            activeSocket.emit(eventName, payload);
            return;
        }

        activeSocket.once("connect", () => {
            activeSocket.emit(eventName, payload);
        });

        activeSocket.connect();
    };

    useEffect(() => {
        if (socketRef.current) return;

        // Allow both websocket and polling with automatic fallback
        const newSocket = io("http://localhost:5000", {
            path: "/socket.io",
            withCredentials: true,
            transports: ["websocket"],

            reconnection: true,

        });

        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);

            const userId = getUserId();
            if (user && userId) {
                newSocket.emit("join", {
                    id: userId,
                    name: user.name
                });
            }
        });

        newSocket.on("connect_error", (error) => {
            console.error("Socket connection error:", error.message);
        });

        newSocket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
        });

        newSocket.on("onlineUsers", (users) => {
            console.log("Online users:", users);
            setOnlineUsers(users);
        });

        newSocket.on("userOnline", (userData) => {
            console.log("User online:", userData);
            setOnlineUsers((prev) => {
                if (!prev.find(u => u.id === userData.userId)) {
                    return [...prev, userData];
                }
                return prev;
            });
        });

        newSocket.on("userOffline", (userData) => {
            console.log("User offline:", userData);
            setOnlineUsers((prev) => prev.filter(u => u.id !== userData.userId));
        });

        newSocket.on("roomsList", (roomsList) => {
            console.log("Rooms list:", roomsList);
            setRooms(roomsList);
        });

        newSocket.on("roomCreated", (room) => {
            console.log("Room created:", room);
            const normalizedRoom = {
                id: room?.id || room?.roomId,
                name: room?.name,
                userCount: room?.userCount ?? 0,
                createdAt: room?.createdAt || new Date().toISOString()
            };

            if (!normalizedRoom.id) {
                return;
            }

            setRooms((prev) => {
                const exists = prev.some((existingRoom) => existingRoom.id === normalizedRoom.id);
                return exists ? prev : [...prev, normalizedRoom];
            });
        });

        // Direct message room created listener (from backend)
        newSocket.on("directMessageRoomCreated", (data) => {
            console.log("DM Room created:", data);
            setDirectMessageRoom(data.roomId);
            setDmMessages(data.messages || []);
            setDmParticipants(data.participants || []);
        });

        // Direct message listener (for receiving DMs)
        newSocket.on("directMessage", (messageData) => {
            console.log("Direct message received:", messageData);
            setDmMessages((prev) => [...prev, messageData]);
        });

        newSocket.on("newDirectMessage", (data) => {
            console.log("New DM notification:", data);
            setDirectMessageRoom(data.roomId);
            if (data.messages) {
                setDmMessages(data.messages);
            }
        });

        // Room users listener
        newSocket.on("roomUsers", (users) => {
            console.log("Room users:", users);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        return () => {
            newSocket.close();
            socketRef.current = null;
        };
    }, []);

    useEffect(() => {
        const userId = getUserId();
        if (socket && user && userId) {
            console.log("Emitting join with user:", user);
            emitWhenConnected("join", {
                id: userId,
                name: user.name
            });
        }
    }, [socket, user]);

    useEffect(() => {
        if (socket) {
            emitWhenConnected("getRooms");
        }
    }, [socket]);

    const joinRoom = (roomId, roomName) => {
        const userId = getUserId();
        if (socket && user && userId) {
            console.log("Joining room:", roomId);
            emitWhenConnected("joinRoom", {
                roomId,
                roomName,
                user: { id: userId, name: user.name }
            });
        }
    };

    const leaveRoom = (roomId) => {
        const userId = getUserId();
        if (socket && user && userId) {
            console.log("Leaving room:", roomId);
            emitWhenConnected("leaveRoom", {
                roomId,
                user: { id: userId, name: user.name }
            });
        }
    };

    const sendMessage = (roomId, message) => {
        const userId = getUserId();
        if (socket && user && userId) {
            console.log("Sending message to room:", roomId, message);
            emitWhenConnected("joinRoom", {
                roomId,
                user: { id: userId, name: user.name }
            });
            emitWhenConnected("sendMessage", {
                roomId,
                message,
                sender: { id: userId, name: user.name }
            });
        }
    };

    const createRoom = (roomName) => {
        const userId = getUserId();
        if (socket && user && userId) {
            console.log("Creating room:", roomName);
            emitWhenConnected("createRoom", {
                roomName,
                user: { id: userId, name: user.name }
            });
        }
    };

    const emitTyping = (roomId) => {
        if (socket && user) {
            emitWhenConnected("typing", { roomId, user: user.name });
        }
    };

    const emitStopTyping = (roomId) => {
        if (socket && user) {
            emitWhenConnected("stopTyping", { roomId, user: user.name });
        }
    };

    // Direct message functions
    const startDirectMessage = (targetUser) => {
        const userId = getUserId();
        const targetUserId = targetUser?.id || targetUser?._id;
        if (socket && user && userId && targetUserId) {
            console.log("Starting DM with:", targetUser);
            emitWhenConnected("startDirectMessage", {
                currentUser: { id: userId, name: user.name },
                targetUser: { id: targetUserId, name: targetUser.name }
            });
        }
    };

    const sendDirectMessage = (roomId, message) => {
        const userId = getUserId();
        if (socket && user && userId) {
            console.log("Sending DM to room:", roomId, "message:", message);
            emitWhenConnected("joinRoom", {
                roomId,
                user: { id: userId, name: user.name }
            });
            emitWhenConnected("sendDirectMessage", {
                roomId,
                message,
                sender: { id: userId, name: user.name }
            });
        }
    };

    const clearDirectMessage = () => {
        setDirectMessageRoom(null);
        setDmMessages([]);
        setDmParticipants([]);
    };

    return (
        <SocketContext.Provider value={{
            socket,
            onlineUsers,
            rooms,
            joinRoom,
            leaveRoom,
            sendMessage,
            createRoom,
            emitTyping,
            emitStopTyping,
            directMessageRoom,
            dmMessages,
            dmParticipants,
            startDirectMessage,
            sendDirectMessage,
            clearDirectMessage
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
