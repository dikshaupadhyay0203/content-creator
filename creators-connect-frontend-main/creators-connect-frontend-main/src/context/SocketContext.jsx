import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        // Connect to socket server
        const newSocket = io("http://localhost:5000", {
            withCredentials: true,
            transports: ["websocket", "polling"]
        });

        newSocket.on("connect", () => {
            console.log("Connected to socket server");

            // Join with user info if logged in
            if (user) {
                newSocket.emit("join", {
                    id: user.id,
                    name: user.name
                });
            }
        });

        newSocket.on("onlineUsers", (users) => {
            setOnlineUsers(users);
        });

        newSocket.on("userOnline", (userData) => {
            setOnlineUsers((prev) => {
                if (!prev.find(u => u.id === userData.userId)) {
                    return [...prev, userData];
                }
                return prev;
            });
        });

        newSocket.on("userOffline", (userData) => {
            setOnlineUsers((prev) => prev.filter(u => u.id !== userData.userId));
        });

        newSocket.on("roomsList", (roomsList) => {
            setRooms(roomsList);
        });

        newSocket.on("roomCreated", (room) => {
            setRooms((prev) => [...prev, room]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [user]);

    // Get rooms when socket is connected
    useEffect(() => {
        if (socket) {
            socket.emit("getRooms");
        }
    }, [socket]);

    const joinRoom = (roomId, roomName) => {
        if (socket && user) {
            socket.emit("joinRoom", {
                roomId,
                user: { id: user.id, name: user.name }
            });
        }
    };

    const leaveRoom = (roomId) => {
        if (socket && user) {
            socket.emit("leaveRoom", {
                roomId,
                user: { id: user.id, name: user.name }
            });
        }
    };

    const sendMessage = (roomId, message) => {
        if (socket && user) {
            socket.emit("sendMessage", {
                roomId,
                message,
                sender: { id: user.id, name: user.name }
            });
        }
    };

    const createRoom = (roomName) => {
        if (socket && user) {
            socket.emit("createRoom", {
                roomName,
                user: { id: user.id, name: user.name }
            });
        }
    };

    const emitTyping = (roomId) => {
        if (socket && user) {
            socket.emit("typing", { roomId, user: user.name });
        }
    };

    const emitStopTyping = (roomId) => {
        if (socket && user) {
            socket.emit("stopTyping", { roomId, user: user.name });
        }
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
            emitStopTyping
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
