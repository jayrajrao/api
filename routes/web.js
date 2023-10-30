const express = require("express");
const router = express.Router();

const UserController= require('../controller/UserController')
const ProductController = require("../controller/ProductController");


// //blog controller
router.post("/create", ProductController.create);
router.get("/display", ProductController.display);
router.get("/view/:id", ProductController.view);
router.put("/update/:id", ProductController.update);
router.delete("/delete/:id", ProductController.delete);

// //blog controller
router.post("/createuser", UserController.createuser);
router.post("/register", UserController.register);
router.post("/login", UserController.verifylogin);
router.post("/logout", UserController.logout);
// router.post("/createuser", UserController.create);

//cartcontroller


module.exports = router;
