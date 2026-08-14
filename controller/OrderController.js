const OrderModel = require("../models/OrderModel");
const CartModel = require("../models/CartModel");

class OrderController {

  // ========== CREATE ORDER FROM CART ==========
  static createOrder = async (req, res) => {
    try {
      const cart = await CartModel.findOne({ user: req.user.id });

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
      .populate("items.product", "name images")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  };

  // ========== GET SINGLE ORDER (user's own) ==========
  static getOrderById = async (req, res) => {
    try {
      const order = await OrderModel.findById(req.params.id)
        .populate("items.product", "name images price");

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // ownership check
      if (
        req.user.role !== "admin" &&
        order.user.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch order",
      });
    }
  };

  // ========== REQUEST RETURN (user) ==========
  static requestReturn = async (req, res) => {
    try {
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Return reason is required",
        });
      }

      const order = await OrderModel.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // ownership check
      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // ✅ only delivered orders can be returned
      if (order.orderStatus !== "delivered") {
        return res.status(400).json({
          success: false,
          message: "Only delivered orders can be returned",
        });
      }

      if (order.returnStatus !== "none") {
        return res.status(400).json({
          success: false,
          message: "Return already requested for this order",
        });
      }

      order.returnStatus = "requested";
      order.returnReason = reason;
      await order.save();

      res.status(200).json({
        success: true,
        message: "Return request submitted",
        order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to request return",
      });
    }
  };

  // ========== ADMIN: GET ALL ORDERS ==========
  static getAllOrders = async (req, res) => {
    try {
      const { status, returnStatus } = req.query;
      const query = {};

      if (status) query.orderStatus = status;
      if (returnStatus) query.returnStatus = returnStatus;

      const orders = await OrderModel.find(query)
        .populate("user", "name email")
        .populate("items.product", "name")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
      });
    }
  };

  // ========== ADMIN: UPDATE ORDER STATUS (shipped/delivered/cancelled) ==========
  static updateOrderStatus = async (req, res) => {
    try {
      const { orderStatus } = req.body;

      const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(orderStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
      }

      const order = await OrderModel.findByIdAndUpdate(
        req.params.id,
        { orderStatus },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Order status updated",
        order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update order status",
      });
    }
  };

  // ========== ADMIN: APPROVE/REJECT RETURN ==========
  static updateReturnStatus = async (req, res) => {
    try {
      const { returnStatus } = req.body;

      const validStatuses = ["approved", "rejected", "completed"];
      if (!validStatuses.includes(returnStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid return status",
        });
      }

      const order = await OrderModel.findById(req.params.id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      order.returnStatus = returnStatus;

      // ✅ agar return complete hua, refund bhi initiate karo
      if (returnStatus === "completed") {
        order.refundStatus = "initiated";
      }

      await order.save();

      res.status(200).json({
        success: true,
        message: "Return status updated",
        order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update return status",
      });
    }
  };
}

module.exports = OrderController;