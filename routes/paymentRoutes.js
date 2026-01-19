const express = require("express");
const router = express.Router();

const PaymentController = require("../controller/PaymentController");
const users_auth = require("../middleware/auth");

// CREATE RAZORPAY ORDER
router.post(
  "/create-order",
  users_auth,
  PaymentController.createOrder
);

// VERIFY PAYMENT
router.post(
  "/verify",
  users_auth,
  PaymentController.verifyPayment
);

module.exports = router;
