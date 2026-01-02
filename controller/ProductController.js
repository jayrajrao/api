var cloudinary = require("cloudinary").v2;
//calling model
const ProductModel = require("../models/ProductModel");

// const jwt = require("jsonwebtoken");
//clouidanery configration
cloudinary.config({
  cloud_name: "dzdnamaqf",
  api_key: "453969946325322",
  api_secret: "I0XGUftEgyZR_H2FC7MeD8gTSoM",
});

class ProductController {

  // ===== CREATE PRODUCT =====
  static create = async (req, res) => {
    try {
      if (!req.files || !req.files.image) {
        return res.status(400).json({
          success: false,
          message: "Product image is required",
        });
      }

      const file = req.files.image;
      const uploadImage = await cloudinary.uploader.upload(
        file.tempFilePath,
        { folder: "products" }
      );

      const {
        name,
        description,
        price,
        rating,
        category,
        stock,
        productID,
      } = req.body;

      const product = await ProductModel.create({
        name,
        description,
        price,
        rating,
        category,
        stock,
        productID,
        images: {
          public_id: uploadImage.public_id,
          url: uploadImage.secure_url,
        },
      });

      res.status(201).json({
        success: true,
        product,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Product creation failed",
      });
    }
  };

  // ===== GET ALL PRODUCTS =====
  static getAll = async (req, res) => {
    try {
      const products = await ProductModel.find();
      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch products",
      });
    }
  };

  // ===== GET SINGLE PRODUCT =====
  static getById = async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching product",
      });
    }
  };

  // ===== UPDATE PRODUCT =====
  static update = async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      let imageData = product.images;

      if (req.files && req.files.image) {
        // delete old image
        await cloudinary.uploader.destroy(product.images.public_id);

        const uploadImage = await cloudinary.uploader.upload(
          req.files.image.tempFilePath,
          { folder: "products" }
        );

        imageData = {
          public_id: uploadImage.public_id,
          url: uploadImage.secure_url,
        };
      }

      await ProductModel.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          images: imageData,
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Product update failed",
      });
    }
  };

  // ===== DELETE PRODUCT =====
  static delete = async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // delete image from cloudinary
      await cloudinary.uploader.destroy(product.images.public_id);

      await ProductModel.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Product delete failed",
      });
    }
  };
}

module.exports = ProductController;
