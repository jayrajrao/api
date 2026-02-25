const express = require("express");
const router = express.Router();

const ProductController = require("../controller/ProductController");
const users_auth = require("../middleware/auth");
const isAdmin = require('../middleware/isAdmin')
// ===== Admin / Protected Routes =====
router.post("/", users_auth, isAdmin ,ProductController.create);
router.put("/:id",isAdmin, users_auth, ProductController.update);
router.delete("/:id", users_auth, isAdmin,  ProductController.delete);

// ===== Public Routes =====
router.get("/", ProductController.getAll);
router.get("/:id", ProductController.getById);

module.exports = router;
