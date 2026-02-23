import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
    getConversation,
    getMessages,
    createConversation,
    sendMessage,
    sendMediaMessage
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/", protect, getConversation);
router.post("/message", protect, sendMessage);
router.post("/message/media", protect, upload.single("file"), sendMediaMessage);
router.get("/:conversationId", protect, getMessages);
router.post("/conversation", protect, createConversation);

export default router;