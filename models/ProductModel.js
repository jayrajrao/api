const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
    },

 category: {
  type: String,
  required: true,
  lowercase: true,
  trim: true,
},

    rating: {
      type: Number,
      default: 0,
    },

    numOfReviews: {
      type: Number,
      default: 0,
    },

    images: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },

    productID: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// ===== Auto Product ID =====
productSchema.pre("save", function (next) {
  if (!this.productID) {
    this.productID = "PROD-" + Date.now();
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
