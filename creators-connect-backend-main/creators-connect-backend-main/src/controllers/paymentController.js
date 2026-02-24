import Plan from "../models/Plan.js";
import Order from "../models/Order.js";
import razorpay, { razorpayKeyId } from "../config/razorpay.js";
import crypto from "crypto";

export const getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch plans" });
    }
};

export const createOrder = async (req, res) => {
    try {
        const { planId } = req.body;

        const plan = await Plan.findById(planId);

        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(plan.price * 100),
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        });

        const order = await Order.create({
            user: req.user._id,
            plan: plan._id,
            amount: plan.price,
            tokens: plan.tokens + plan.bonusTokens,
            razorpay_order_id: razorpayOrder.id
        });

        res.json({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: razorpayKeyId,
            order
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to create order" });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing payment verification fields" });
        }

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || process.env.TEST_SECRET_KEY)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Invalid payment signature" });
        }

        const order = await Order.findOne({
            razorpay_order_id,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status === "paid") {
            return res.json({ message: "Payment already verified", order });
        }

        order.status = "paid";
        order.razorpay_payment_id = razorpay_payment_id;
        await order.save();

        req.user.tokens += order.tokens;
        await req.user.save();

        res.json({ message: "Payment verified successfully", order });
    } catch (error) {
        res.status(500).json({ message: "Failed to verify payment" });
    }
};
