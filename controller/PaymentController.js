const Razorpay = require("razorpay");
const crypto = require("crypto");
const OrderModel = require("../models/OrderModel");

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("❌ Razorpay keys missing in .env");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class PaymentController {

  // ================= CREATE RAZORPAY ORDER =================
 static createOrder = async (req, res) => {
    try {
      const { orderId } = req.body;

      /
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "orderId is required",
        });
      }

      // 🔍 find order
      const order = await OrderModel.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // 🛑 prevent double payment
      if (order.paymentStatus === "paid") {
        return res.status(400).json({
          success: false,
          message: "Order already paid",
        });
      }

      // 💰 create razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(order.totalAmount * 100), // ₹ → paise
        currency: "INR",
        receipt: `order_${order._id}`,
      });

      // 💾 save razorpay order id
      order.razorpayOrderId = razorpayOrder.id;
      order.paymentStatus = "pending";
      await order.save();

      // ✅ response
      return res.status(200).json({
        success: true,
        razorpayOrder,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Create Razorpay Order Error:", error);
      return res.status(500).json({
        success: false,
        message: "Razorpay order creation failed",
      });
    }
  };

  // ================= VERIFY PAYMENT =================
  static verifyPayment = async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      const sign = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature",
        });
      }

      const order = await OrderModel.findOne({
        razorpayOrderId: razorpay_order_id,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      order.paymentStatus = "paid";
      order.paymentId = razorpay_payment_id;
      await order.save();

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  };
}

module.exports = PaymentController;
