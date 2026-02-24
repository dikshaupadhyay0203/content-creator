import crypto from "crypto";
import User from "../models/User.js";
import Order from "../models/Order.js";

export const handleWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            return res.status(500).json({ message: "Missing webhook secret" });
        }

        const signature = req.headers["x-razorpay-signature"];
        const body = req.body;
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            return res.status(400).json({ message: "Invalid signature" });
        }

        const event = JSON.parse(body.toString());

        if (event.event === "payment.captured") {
            const payment = event.payload.payment.entity;

            const order = await Order.findOne({ razorpay_order_id: payment.order_id });

            if (!order || order.status === "paid") {
                return res.json({ message: "Webhook received" });
            }

            order.status = "paid";
            order.razorpay_payment_id = payment.id;
            await order.save();

            const user = await User.findById(order.user);
            if (user) {
                user.tokens += order.tokens;
                await user.save();
            }

        }
        res.json({ message: "Webhook received" });
    } catch (error) {
        console.error("Error handling webhook:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};