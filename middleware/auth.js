const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const users_auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - token missing",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - invalid token format",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ NEW — fetch fresh user from DB
    const user = await UserModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user; // 👈 now full user object
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - token invalid",
    });
  }
};

module.exports = users_auth;