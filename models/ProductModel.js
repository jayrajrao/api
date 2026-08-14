const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: { type: Number, default: 0 },
    numOfReviews: { type: Number, default: 0 },

    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",   
    },

    productID: { type: String, unique: true },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (!this.productID) {
    this.productID = "PROD-" + Date.now();
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);