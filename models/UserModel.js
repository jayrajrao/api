const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

   email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
},
password: {
  type: String,
  required: true,
  select: false,   // ab default queries mein nahi aayega
},

    role: {
      type: String,
      enum: ["user", "admin", "vendor"],
      default: "user",
    },
     businessName: {
      type: String,
      trim: true,
    },
    isVendorApproved: {
      type: Boolean,
      default: false,   
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
