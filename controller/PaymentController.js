const Stripe = require("stripe");
const OrderModel = require("../models/OrderModel");

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ STRIPE_SECRET_KEY missing in .env");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentController {
  static createPaymentIntent = async (req, res) => {
    try {
      const { orderId } = req.body;

      const order = await OrderModel.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100),
        currency: "inr",
        metadata: { orderId },
      });

      order.paymentIntentId = paymentIntent.id;
      await order.save();

      res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Payment intent creation failed",
      });
    }
  };

  static confirmPayment = async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      const order = await OrderModel.findOne({ paymentIntentId });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      order.paymentStatus = "paid";
      await order.save();

      res.status(200).json({
        success: true,
        message: "Payment successful",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Payment confirmation failed",
      });
    }
  };
}

module.exports = PaymentController;
