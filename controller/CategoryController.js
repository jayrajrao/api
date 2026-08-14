const CategoryModel = require("../models/CategoryModel");

class CategoryController {

  // ================= CREATE CATEGORY (Admin only) =================
  static create = async (req, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Category name is required",
        });
      }

      const existing = await CategoryModel.findOne({ name: name.toLowerCase() });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Category already exists",
        });
      }

      const category = await CategoryModel.create({ name });

      res.status(201).json({
        success: true,
        category,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to create category",
      });
    }
  };

  // ================= GET ALL CATEGORIES (Public) =================
  static getAll = async (req, res) => {
    try {
      // Public users only see active categories; admin sees all
      const filter = req.user?.role === "admin" ? {} : { isActive: true };

      const categories = await CategoryModel.find(filter).sort({ name: 1 });

      res.status(200).json({
        success: true,
        categories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories",
      });
    }
  };

  // ================= UPDATE CATEGORY (Admin only) =================
  static update = async (req, res) => {
    try {
      const { name, isActive } = req.body;

      const category = await CategoryModel.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      if (name) {
        category.name = name;
        category.slug = undefined; // force re-generate slug in pre-save hook
      }
      if (typeof isActive === "boolean") {
        category.isActive = isActive;
      }

      await category.save();

      res.status(200).json({
        success: true,
        category,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to update category",
      });
    }
  };

  // ================= DELETE CATEGORY (Admin only) =================
  static delete = async (req, res) => {
    try {
      const ProductModel = require("../models/ProductModel");

      // 🛑 prevent deleting category that's in use
      const inUse = await ProductModel.exists({ category: req.params.id });
      if (inUse) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete category - products are using it. Deactivate it instead.",
        });
      }

      const category = await CategoryModel.findByIdAndDelete(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Category deleted",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete category",
      });
    }
  };
}

module.exports = CategoryController;