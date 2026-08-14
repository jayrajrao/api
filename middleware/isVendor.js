const isVendor = (req, res, next) => {
  if (req.user?.role !== "vendor" && req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Vendor access required",
    });
  }
  next();
};

module.exports = isVendor;