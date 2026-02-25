const Razorpay = require("razorpay");
const crypto = require("crypto");
const OrderModel = require("../models/OrderModel");
const ProductModel = require("../models/ProductModel");
const CartModel = require("../models/CartModel");

// 🔐 Razorpay instance check
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

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "orderId is required",
        });
      }

      const order = await OrderModel.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // ✅ ownership check (IMPORTANT)
      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to order",
        });
      }

      // 🛑 prevent double payment
      if (order.paymentStatus === "paid") {
        return res.status(400).json({
          success: false,
          message: "Order already paid",
        });
      }

      // 🛑 validate amount
      if (!order.totalAmount || order.totalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid order amount",
        });
      }

      // 🛑 prevent duplicate razorpay order creation
      if (order.razorpayOrderId) {
        return res.status(200).json({
          success: true,
          razorpayOrder: {
            id: order.razorpayOrderId,
            amount: Math.round(order.totalAmount * 100),
            currency: "INR",
          },
          key: process.env.RAZORPAY_KEY_ID,
        });
      }

      // 💰 create razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(order.totalAmount * 100),
        currency: "INR",
        receipt: `order_${order._id.toString().slice(-20)}`,
      });

      // 💾 save razorpay order id
      order.razorpayOrderId = razorpayOrder.id;
      order.paymentStatus = "pending";
      await order.save();

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

      // 🛑 validation (FIXED TYPO)
      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing payment fields",
        });
      }

      // 🔐 signature verify
      const sign = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign)
        .digest("hex");

      // ✅ safe compare
      if (
        expectedSignature.length !== razorpay_signature.length ||
        !crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(razorpay_signature)
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature",
        });
      }

      // 🔍 find order
      const order = await OrderModel.findOne({
        razorpayOrderId: razorpay_order_id,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // 🛑 prevent double marking
      if (order.paymentStatus === "paid") {
        return res.status(200).json({
          success: true,
          message: "Payment already verified",
        });
      }

      // ================= STOCK REDUCTION =================
      for (const item of order.items) {
        const product = await ProductModel.findById(item.product);

        if (!product) continue;

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}`,
          });
        }

        product.stock -= item.quantity;
        await product.save();
      }

      // ================= MARK ORDER PAID =================
      order.paymentStatus = "paid";
      order.paymentId = razorpay_payment_id;
      order.paidAt = new Date();
      order.orderStatus = "processing";

      await order.save();

      // ================= CLEAR USER CART =================
      await CartModel.findOneAndDelete({ user: order.user });

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
      });
    } catch (error) {
      console.error("Verify Payment Error:", error);
      return res.status(500).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  };
}

module.exports = PaymentController;