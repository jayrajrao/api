const express = require("express");
const router = express.Router();

const OrderController = require("../controller/OrderController");
const users_auth = require("../middleware/auth");

router.post("/create", users_auth, OrderController.createOrder);
router.get("/my-orders", users_auth, OrderController.myOrders);

module.exports = router;
