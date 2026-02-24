import express from "express";
import { createOrder, getPlans, verifyPayment } from "../controllers/paymentController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPlans);
router.post("/create-order", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);

export default router;