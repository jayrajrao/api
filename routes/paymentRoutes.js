const express = require("express");
const PaymentController = require("../controller/PaymentController");
const router = express.Router();



// CREATE PAYMENT INTENT
router.post(
  "/create-payment-intent",
  PaymentController.createPaymentIntent
);

// CONFIRM PAYMENT
router.post(
  "/confirm-payment",
  PaymentController.confirmPayment
);

module.exports = router;
