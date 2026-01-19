const mongoose = require("mongoose");

const connectdb = async () => {
  try {
  //  console.log("MONGO_URI =", process.env.MONGO_URI); // 👈 debug line

    await mongoose.connect(process.env.MONGO_URI);
    console.log("connection success");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectdb;
