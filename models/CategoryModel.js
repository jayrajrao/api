const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    isActive: {
      type: Boolean,
      default: true,   // admin isse false karke category "hide" kar sakta hai bina delete kiye
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name
categorySchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-");
  }
  next();
});

module.exports = mongoose.model("Category", categorySchema);