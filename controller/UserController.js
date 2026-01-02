const UserModel = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class UserController {

  // ================= REGISTER =================
  static register = async (req, res) => {
    try {
      const { name, email, password, cpassword, phone } = req.body;

      if (!name || !email || !password || !cpassword) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      if (password !== cpassword) {
        return res.status(400).json({
          success: false,
          message: "Password not matched",
        });
      }

      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User already exists",
        });
      }

      const hashPassword = await bcrypt.hash(password, 10);

      const user = new UserModel({
        name,
        email,
        phone,
        password: hashPassword,
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

  // ================= LOGIN =================
  static login = async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password required",
        });
      }

      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: false, // production me true
        sameSite: "lax",
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };

  // ================= LOGOUT =================
  static logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  };
}

module.exports = UserController;
