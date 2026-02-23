const OrderModel = require("../models/OrderModel");
const CartModel = require("../models/CartModel");

class OrderController {

  // ========== CREATE ORDER FROM CART ==========
  static createOrder = async (req, res) => {
    try {
      const cart = await CartModel.findOne({ user: req.user.id });
console.log("REQ USER:", req.user);
console.log("CART FOUND:", cart);
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        });
      }

      const order = await OrderModel.create({
        user: req.user.id,
        items: cart.items,
        totalAmount: cart.totalPrice,
        paymentStatus: "pending",
      });

      res.status(201).json({
        success: true,
        order,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Order creation failed",
      });
    }
  };

  // ========== GET USER ORDERS ==========
  static myOrders = async (req, res) => {
    const orders = await OrderModel.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  };
}

module.exports = OrderController;
