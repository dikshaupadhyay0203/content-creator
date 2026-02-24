import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";

const ACTIVE_CHAT_STORAGE_KEY = "active_chat_room";

const ChatRoom = () => {
    const { user } = useAuth();
    const currentUserId = user?.id || user?._id;
    const {
        socket,
        onlineUsers,
        rooms,
        joinRoom,
        leaveRoom,
        sendMessage,
        createRoom,
        emitTyping,
        emitStopTyping,
        dmMessages,
        sendDirectMessage,
        clearDirectMessage
    } = useSocket();

    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [roomUsers, setRoomUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [isDirectMessage, setIsDirectMessage] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const getRoomIdentifier = (room) => room?.id || room?.roomId;
    const getRoomDisplayName = (room) => {
        const roomIdentifier = getRoomIdentifier(room);
        const originalName = room?.name;

        if (!roomIdentifier) {
            return originalName || "Chat";
        }

        const isDirectRoom = roomIdentifier.includes("_dm_");
        if (!isDirectRoom) {
            return originalName || roomIdentifier;
        }

        if (originalName && !originalName.includes("_dm_")) {
            return originalName;
        }

        const [firstUserId, secondUserId] = roomIdentifier.split("_dm_");
        const currentUserIdString = String(currentUserId || "");
        const otherUserId = [firstUserId, secondUserId].find((id) => id !== currentUserIdString);
        const otherUser = onlineUsers?.find((u) => String(u.id) === String(otherUserId));

        return otherUser?.name || "Direct Message";
    };

    const persistActiveRoom = (roomData) => {
        if (!roomData) {
            localStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
            return;
        }

        localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, JSON.stringify(roomData));
    };

    const getStoredRoom = () => {
        try {
            const stored = localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    };

    // Check if navigated from Dashboard with direct message
    useEffect(() => {
        const state = location.state;
        if (state?.directMessage && state?.roomId) {
            setIsDirectMessage(true);
            setCurrentRoom({
                id: state.roomId,
                name: state.recipientName || "Chat",
                recipientId: state.recipientId
            });

            // Join the room when direct message is detected
            if (socket && user) {
                console.log("Joining DM room:", state.roomId);
                joinRoom(state.roomId, state.recipientName || "Chat");
            }

            persistActiveRoom({
                id: state.roomId,
                name: state.recipientName || "Chat",
                recipientId: state.recipientId,
                isDirectMessage: true
            });
        }
    }, [location.state, socket, user, currentUserId, joinRoom]);

    useEffect(() => {
        const state = location.state;
        if (!socket || !user) return;
        if (state?.directMessage && state?.roomId) return;
        if (currentRoom) return;

        const storedRoom = getStoredRoom();
        if (!storedRoom?.id) return;

        setIsDirectMessage(Boolean(storedRoom.isDirectMessage));
        setCurrentRoom({
            id: storedRoom.id,
            name: storedRoom.name || "Chat",
            recipientId: storedRoom.recipientId
        });
        joinRoom(storedRoom.id, storedRoom.name || "Chat");
    }, [socket, user, location.state, currentRoom, joinRoom]);

    useEffect(() => {
        if (!currentRoom) {
            persistActiveRoom(null);
            return;
        }

        persistActiveRoom({
            id: getRoomIdentifier(currentRoom),
            name: currentRoom.name,
            recipientId: currentRoom.recipientId,
            isDirectMessage
        });
    }, [currentRoom, isDirectMessage]);

    // Listen for messages from socket
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (messageData) => {
            console.log("Received room message:", messageData);
            const incomingRoomId = messageData?.roomId;
            const currentRoomId = getRoomIdentifier(currentRoom);

            if (incomingRoomId && currentRoomId === incomingRoomId) {
                setMessages(prev => [...prev, messageData]);
                return;
            }

            if (incomingRoomId && messageData?.sender?.name !== user?.name) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [incomingRoomId]: (prev[incomingRoomId] || 0) + 1
                }));
            }
        };

        const handlePreviousMessages = (messages) => {
            console.log("Received previous messages:", messages);
            setMessages(messages);
        };

        const handleDirectMessage = (messageData) => {
            console.log("Received direct message:", messageData);
            const incomingRoomId = messageData?.roomId;
            const currentRoomId = getRoomIdentifier(currentRoom);

            if (incomingRoomId && currentRoomId === incomingRoomId) {
                setMessages(prev => [...prev, messageData]);
                return;
            }

            if (incomingRoomId && messageData?.sender?.name !== user?.name) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [incomingRoomId]: (prev[incomingRoomId] || 0) + 1
                }));
            }
        };

        const handleDmHistory = (data) => {
            console.log("DM History received in ChatRoom:", data);
            if (data.messages) {
                setMessages(data.messages);
            }
        };

        const handleRoomUsers = (users) => {
            setRoomUsers(users || []);
        };

        const handleUserTyping = ({ roomId, user: typingUserName }) => {
            const currentRoomId = getRoomIdentifier(currentRoom);
            if (!currentRoomId || currentRoomId !== roomId) return;
            if (typingUserName === user?.name) return;
            setTypingUser(typingUserName);
        };

        const handleUserStoppedTyping = ({ roomId, user: typingUserName }) => {
            const currentRoomId = getRoomIdentifier(currentRoom);
            if (!currentRoomId || currentRoomId !== roomId) return;
            if (!typingUser || typingUser === typingUserName) {
                setTypingUser(null);
            }
        };

        socket.on("message", handleMessage);
        socket.on("previousMessages", handlePreviousMessages);
        socket.on("directMessage", handleDirectMessage);
        socket.on("directMessageRoomCreated", handleDmHistory);
        socket.on("roomUsers", handleRoomUsers);
        socket.on("userTyping", handleUserTyping);
        socket.on("userStoppedTyping", handleUserStoppedTyping);

        return () => {
            socket.off("message", handleMessage);
            socket.off("previousMessages", handlePreviousMessages);
            socket.off("directMessage", handleDirectMessage);
            socket.off("directMessageRoomCreated", handleDmHistory);
            socket.off("roomUsers", handleRoomUsers);
            socket.off("userTyping", handleUserTyping);
            socket.off("userStoppedTyping", handleUserStoppedTyping);
        };
    }, [socket, currentRoom, isDirectMessage, typingUser, user?.name]);

    useEffect(() => {
        if (!socket || !currentRoom || isDirectMessage) return;

        const roomIdentifier = getRoomIdentifier(currentRoom);
        if (!roomIdentifier) return;

        socket.emit("getRoomUsers", roomIdentifier);
    }, [socket, currentRoom, isDirectMessage]);

    // Also sync with context dmMessages
    useEffect(() => {
        if (isDirectMessage && dmMessages && dmMessages.length > 0) {
            console.log("Syncing dmMessages from context:", dmMessages);
            setMessages(dmMessages);
        }
    }, [dmMessages, isDirectMessage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleJoinRoom = (room) => {
        const roomIdentifier = getRoomIdentifier(room);
        if (!roomIdentifier) return;

        if (currentRoom && !isDirectMessage) {
            leaveRoom(getRoomIdentifier(currentRoom));
        }
        setIsDirectMessage(false);
        joinRoom(roomIdentifier, room.name);
        setCurrentRoom({ ...room, id: roomIdentifier });
        setMessages([]);
        setTypingUser(null);
        setUnreadCounts((prev) => ({ ...prev, [roomIdentifier]: 0 }));
    };

    const handleLeaveRoom = () => {
        if (currentRoom) {
            const roomIdentifier = getRoomIdentifier(currentRoom);
            if (isDirectMessage) {
                clearDirectMessage();
            } else {
                leaveRoom(roomIdentifier);
            }
            setCurrentRoom(null);
            setMessages([]);
            setRoomUsers([]);
            setIsDirectMessage(false);
            setTypingUser(null);
            persistActiveRoom(null);
            navigate("/dashboard");
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        const roomIdentifier = getRoomIdentifier(currentRoom);
        if (message.trim() && roomIdentifier) {
            console.log("Sending message:", message.trim(), "to room:", roomIdentifier);

            if (isDirectMessage) {
                sendDirectMessage(roomIdentifier, message.trim());
            } else {
                sendMessage(roomIdentifier, message.trim());
            }

            setMessage("");
            if (roomIdentifier) {
                emitStopTyping(roomIdentifier);
            }
            setIsTyping(false);
        }
    };

    const handleCreateRoom = (e) => {
        e.preventDefault();
        if (newRoomName.trim()) {
            createRoom(newRoomName.trim());
        }
    };

    const handleTyping = (e) => {
        setMessage(e.target.value);

        if (!isTyping && currentRoom) {
            setIsTyping(true);
            const roomIdentifier = getRoomIdentifier(currentRoom);
            if (roomIdentifier) {
                emitTyping(roomIdentifier);
            }
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            if (currentRoom) {
                const roomIdentifier = getRoomIdentifier(currentRoom);
                if (roomIdentifier) {
                    emitStopTyping(roomIdentifier);
                }
                setIsTyping(false);
            }
        }, 2000);
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Layout>
            <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-120px)] gap-4">
                {!isDirectMessage && (
                    <div className="w-full lg:w-1/4 bg-[#1F2937] rounded-xl shadow-md p-4 flex flex-col transition-all duration-300 ease-in-out">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[#E5E7EB]">Chat Rooms</h2>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-[#10B981] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#059669] transition-all duration-300 ease-in-out"
                            >
                                + New
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {rooms.length === 0 ? (
                                <p className="text-[#9CA3AF] text-center py-4">No rooms yet</p>
                            ) : (
                                rooms.map((room) => (
                                    <div
                                        key={getRoomIdentifier(room)}
                                        onClick={() => handleJoinRoom(room)}
                                        className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-300 ease-in-out ${getRoomIdentifier(currentRoom) === getRoomIdentifier(room)
                                            ? "bg-[#111827] border-l-4 border-[#10B981]"
                                            : "hover:bg-[#111827] hover:scale-[1.01]"
                                            }`}
                                    >
                                        <p className="font-medium text-[#E5E7EB]">{getRoomDisplayName(room)}</p>
                                        <p className="text-xs text-[#9CA3AF]">{room.userCount} users</p>
                                        {(unreadCounts[getRoomIdentifier(room)] || 0) > 0 && (
                                            <p className="text-xs text-[#10B981] mt-1 font-medium">
                                                {unreadCounts[getRoomIdentifier(room)]} new message{unreadCounts[getRoomIdentifier(room)] > 1 ? "s" : ""}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className={`${isDirectMessage ? 'w-full' : 'flex-1'} bg-[#1F2937] rounded-xl shadow-md flex flex-col transition-all duration-300 ease-in-out`}>
                    {currentRoom ? (
                        <>
                            <div className="p-4 border-b border-[#374151] flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-[#E5E7EB]">
                                        {isDirectMessage ? `Chat with ${getRoomDisplayName(currentRoom)}` : getRoomDisplayName(currentRoom)}
                                    </h3>
                                    <p className="text-sm text-[#9CA3AF]">
                                        {isDirectMessage ? "Direct Message" : `${roomUsers.length} users in room`}
                                    </p>
                                </div>
                                <button
                                    onClick={handleLeaveRoom}
                                    className="text-[#E5E7EB] hover:text-[#10B981] transition-all duration-300 ease-in-out text-xs"
                                >
                                    {isDirectMessage ? "Close" : "Leave Room"}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[340px]">
                                {messages.length === 0 ? (
                                    <p className="text-[#9CA3AF] text-center">No messages yet. Say hi!</p>
                                ) : (
                                    messages.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={`flex ${msg.sender?.name === user?.name
                                                ? "justify-end"
                                                : "justify-start"
                                                }`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md ${msg.sender?.name === user?.name
                                                    ? "bg-[#10B981] text-white"
                                                    : "bg-[#111827] text-[#E5E7EB]"
                                                    } rounded-lg p-3`}
                                            >
                                                {!isDirectMessage && (
                                                    <p className={`font-bold mb-1 ${msg.isSystem ? "text-[10px]" : "text-xs"}`}>
                                                        {msg.sender?.name}
                                                    </p>
                                                )}
                                                <p className={msg.isSystem ? "text-[12px] leading-4" : "text-base"}>{msg.text}</p>
                                                <p className={`${msg.isSystem ? "text-[10px]" : "text-xs"} mt-1 ${msg.sender?.name === user?.name
                                                    ? "text-[#D1FAE5]"
                                                    : "text-[#9CA3AF]"
                                                    }`}>
                                                    {formatTime(msg.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {typingUser && (
                                    <p className="text-sm text-[#9CA3AF] italic">
                                        {typingUser} is typing...
                                    </p>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#374151]">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={handleTyping}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!message.trim()}
                                        className="bg-[#10B981] text-white px-6 py-2 rounded-lg hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
                                    >
                                        Send
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-[#9CA3AF] text-lg mb-4">
                                    Select a chat room to start chatting
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {!isDirectMessage && (
                    <div className="w-full lg:w-1/6 bg-[#1F2937] rounded-xl shadow-md p-4 transition-all duration-300 ease-in-out">
                        <h3 className="text-lg font-bold text-[#E5E7EB] mb-4">Online</h3>
                        <div className="space-y-2">
                            {roomUsers.length > 0 ? (
                                roomUsers.map((u, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#10B981] rounded-full"></span>
                                        <span className="text-[#E5E7EB]">{u.name}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[#9CA3AF] text-sm">No users</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#1F2937] rounded-xl shadow-md p-6 w-96 text-[#E5E7EB]">
                        <h3 className="text-xl font-bold mb-4">Create New Room</h3>
                        <form onSubmit={handleCreateRoom}>
                            <input
                                type="text"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                placeholder="Room name"
                                className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 mb-4 text-[#E5E7EB] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewRoomName("");
                                    }}
                                    className="px-4 py-2 text-[#9CA3AF] hover:text-[#E5E7EB] transition-all duration-300 ease-in-out"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newRoomName.trim()}
                                    className="bg-[#10B981] text-white px-4 py-2 rounded-lg hover:bg-[#059669] disabled:opacity-50 transition-all duration-300 ease-in-out"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ChatRoom;
