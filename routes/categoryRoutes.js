const express = require("express");
const router = express.Router();

const CategoryController = require("../controller/CategoryController");
const users_auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// Public
router.get("/", CategoryController.getAll);

// Admin only
router.post("/", users_auth, isAdmin, CategoryController.create);
router.put("/:id", users_auth, isAdmin, CategoryController.update);
router.delete("/:id", users_auth, isAdmin, CategoryController.delete);

module.exports = router;