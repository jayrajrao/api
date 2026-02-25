const UserModel = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class UserController {

  // ================= REGISTER =================
  static register = async (req, res) => {
    console.log("🔥 REGISTER FUNCTION HIT 🔥");
    try {
      const { name, email, password, cpassword } = req.body;
console.log("REQ BODY:", req.body);
      // Validation
      if (!name || !email || !password || !cpassword) {
  return res.status(400).json({
    success: false,
    message: "🔥 REGISTER VALIDATION HIT 🔥",
  });
}

      if (password !== cpassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match",
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

      await UserModel.create({
        name,
        email,
        password: hashPassword,
        role: "user"
      });

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
          message: "Email and password are required",
        });
      }

      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

   res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // ⭐ add expiry
});

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
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
  res.clearCookie("token", {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  };

  // ================= GET LOGGED-IN USER =================
  static getProfile = async (req, res) => {
    try {
      const user = await UserModel.findById(req.user._id).select("-password");
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
      });
    }
  };
}

module.exports = UserController;
