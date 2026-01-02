const express = require("express");
const router = express.Router();

const CartController = require("../controller/CartController");
const users_auth = require("../middleware/auth");

// All cart routes are protected
router.get("/", users_auth, CartController.getCart);
router.post("/add", users_auth, CartController.addToCart);
router.put("/update", users_auth, CartController.updateQuantity);
router.delete("/remove/:productId", users_auth, CartController.removeItem);
router.delete("/clear", users_auth, CartController.clearCart);

module.exports = router;
