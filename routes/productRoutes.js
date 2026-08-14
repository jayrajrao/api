const express = require("express");
const router = express.Router();

const ProductController = require("../controller/ProductController");
const users_auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const isVendor = require("../middleware/isVendor");

// ===== Vendor/Admin Routes =====
router.post("/", users_auth, isVendor, ProductController.create);
router.put("/:id", users_auth, isVendor, ProductController.update);
router.delete("/:id", users_auth, isVendor, ProductController.delete);
router.get("/vendor/mine", users_auth, isVendor, ProductController.getMyProducts);

// ===== Admin-only Routes =====
router.get("/admin/pending", users_auth, isAdmin, ProductController.getPending);
router.patch("/admin/:id/status", users_auth, isAdmin, ProductController.updateStatus);

// ===== Public Routes =====
router.get("/", ProductController.getAll);
router.get("/:id", ProductController.getById);

module.exports = router;