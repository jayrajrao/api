const express = require("express");
const router = express.Router();


const users_auth = require("../middleware/auth");
const UserController = require("../controller/UserController");

// Public
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/logout", UserController.logout);

// Protected
router.get("/profile", users_auth, UserController.getProfile);

module.exports = router;
