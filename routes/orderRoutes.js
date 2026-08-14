const express = require("express");
const router = express.Router();

const OrderController = require("../controller/OrderController");
const users_auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// ===== User Routes =====
router.post("/create", users_auth, OrderController.createOrder);
router.get("/my-orders", users_auth, OrderController.myOrders);
router.get("/:id", users_auth, OrderController.getOrderById);
router.post("/:id/return", users_auth, OrderController.requestReturn);

// ===== Admin Routes =====
router.get("/admin/all", users_auth, isAdmin, OrderController.getAllOrders);
router.patch("/admin/:id/status", users_auth, isAdmin, OrderController.updateOrderStatus);
router.patch("/admin/:id/return-status", users_auth, isAdmin, OrderController.updateReturnStatus);

module.exports = router;
