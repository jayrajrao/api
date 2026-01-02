const express = require("express");
const router = express.Router();

const ProductController = require("../controller/ProductController");
const users_auth = require("../middleware/auth");

// ===== Admin / Protected Routes =====
router.post("/", users_auth, ProductController.create);
router.put("/:id", users_auth, ProductController.update);
router.delete("/:id", users_auth, ProductController.delete);

// ===== Public Routes =====
router.get("/", ProductController.getAll);
router.get("/:id", ProductController.getById);

module.exports = router;
