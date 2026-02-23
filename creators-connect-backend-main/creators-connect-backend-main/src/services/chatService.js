import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import cloudinary from "../config/cloudinary.js";

export const saveMessageService = async ({ conversationId, sender, text }) => {
    const message = new Message({
        conversationId,
        sender,
        text,
        isSystem: false
    });

    await message.save();

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        lastMessageAt: new Date()
    });

    return message;
};

export const createConversation = async (senderId, receiverId) => {
    let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
        conversation = new Conversation({
            participants: [senderId, receiverId]
        });
        await conversation.save();
    }

    return conversation;
};

export const getConversation = async (userId) => {
    return await Conversation.find({
        participants: { $in: [userId] }
    })
        .populate("participants", "name email")
        .populate("lastMessage")
        .sort({ updatedAt: -1 });
};

export const getMessages = async (conversationId) => {
    return await Message.find({ conversation: conversationId }).sort({ createdAt: 1 });
};

export const sendMessage = async (conversationId, senderId, receiverId, text) => {
    const message = new Message({
        conversation: conversationId,
        sender: senderId,
        receiver: receiverId,
        text
    });

    await message.save();

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id
    });

    return message;
};

export const sendMediaMessage = async (file, conversationId, senderId, receiverId, text) => {
    if (!file) {
        throw new Error("File is required");
    }

    const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                resource_type: "auto"
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        ).end(file.buffer);
    });

    const message = new Message({
        conversation: conversationId,
        sender: senderId,
        receiver: receiverId,
        text: text || "Media Attachment",
        mediaUrl: uploadResult.secure_url,
        mediaType: uploadResult.resource_type
    });

    await message.save();

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id
    });

    return message;
};
