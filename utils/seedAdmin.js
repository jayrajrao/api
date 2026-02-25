const bcrypt = require("bcrypt");
const UserModel = require("../models/UserModel");

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;

    const existingAdmin = await UserModel.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("✅ Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      10
    );

    await UserModel.create({
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log("🔥 Default admin created");
  } catch (error) {
    console.error("❌ Admin seed error:", error.message);
  }
};

module.exports = seedAdmin;