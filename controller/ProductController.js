const cloudinary = require("cloudinary").v2;
const ProductModel = require("../models/ProductModel");
const CategoryModel = require("../models/CategoryModel");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class ProductController {

  // ================= CREATE PRODUCT =================
  static create = async (req, res) => {
    try {
      const { name, description, price, category, stock } = req.body;

      if (!name || !price || !category) {
        return res.status(400).json({
          success: false,
          message: "Name, price and category are required",
        });
      }

      // ✅ validate category exists
      const categoryExists = await CategoryModel.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }

      if (!req.files || !req.files.images) {
        console.log(req.files)
        return res.status(400).json({
          success: false,
          message: "Product image is required",
        });
      }

      const uploadImage = await cloudinary.uploader.upload(
        req.files.images.tempFilePath,
        {
          folder: "productimage",
          unique_filename: true,
          overwrite: false,
        }
      );

      // ✅ Admin-added products auto-approved; vendor products need approval
      const status = req.user.role === "admin" ? "approved" : "pending";

      const product = await ProductModel.create({
        name,
        description,
        price,
        category,
        stock,
        vendor: req.user._id,   // 👈 who added this product
        status,
        images: [
          {
            public_id: uploadImage.public_id,
            url: uploadImage.secure_url,
          },
        ],
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

  // ================= GET ALL (Public — only approved) =================
  static getAll = async (req, res) => {
  
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 50);

      const keyword = req.query.keyword?.trim() || req.query.search?.trim();
      const category = req.query.category?.trim();
      const minPrice = Number(req.query.minPrice);
      const maxPrice = Number(req.query.maxPrice);
      const sort = req.query.sort;

      // const query = { status: "approved" };  // 👈 public sirf approved dekhein
      const query = {};

const approvedCount = await ProductModel.countDocuments({ status: "approved" });
const pendingCount = await ProductModel.countDocuments({ status: "pending" });

console.log("Approved:", approvedCount);
console.log("Pending:", pendingCount);

      if (keyword) {
        query.name = { $regex: keyword, $options: "i" };
      }

      if (category) {
        query.category = category;   // ab category ID hoga
      }

      if (!isNaN(minPrice) || !isNaN(maxPrice)) {
        query.price = {};
        if (!isNaN(minPrice)) query.price.$gte = minPrice;
        if (!isNaN(maxPrice)) query.price.$lte = maxPrice;
      }

      let sortOption = { createdAt: -1 };
      if (sort === "price_asc") sortOption = { price: 1 };
      if (sort === "price_desc") sortOption = { price: -1 };

      const products = await ProductModel.find(query)
        .populate("category", "name slug")
        .populate("vendor", "name businessName")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await ProductModel.countDocuments(query);

      res.status(200).json({
        success: true,
        page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        products,
      });
     
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch products",
      });
    }
  };

  // ================= GET SINGLE PRODUCT =================
  static getById = async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.id)
        .populate("category", "name slug")
        .populate("vendor", "name businessName");

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

  // ================= UPDATE PRODUCT =================
  static update = async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // ✅ vendor apna hi product edit kar sake (admin sab edit kar sakta hai)
      if (
        req.user.role !== "admin" &&
        product.vendor.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own products",
        });
      }

      let imageData = product.images;

      if (req.files && req.files.images) {
        if (product.images?.[0]?.public_id) {
          await cloudinary.uploader.destroy(product.images[0].public_id);
        }

        const uploadImage = await cloudinary.uploader.upload(
          req.files.images.tempFilePath,
          { folder: "productimage" }
        );

        imageData = [
          {
            public_id: uploadImage.public_id,
            url: uploadImage.secure_url,
          },
        ];
      }

      // ✅ agar vendor ne edit kiya to dobara approval chahiye
      const newStatus =
        req.user.role !== "admin" ? "pending" : product.status;

      await ProductModel.findByIdAndUpdate(req.params.id, {
        name: req.body.name ?? product.name,
        description: req.body.description ?? product.description,
        price: req.body.price ?? product.price,
        category: req.body.category ?? product.category,
        stock: req.body.stock ?? product.stock,
        images: imageData,
        status: newStatus,
      });

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

  // ================= DELETE PRODUCT =================
  static delete = async (req, res) => {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (
        req.user.role !== "admin" &&
        product.vendor.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own products",
        });
      }

      if (product.images?.[0]?.public_id) {
        await cloudinary.uploader.destroy(product.images[0].public_id);
      }

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

  // ================= ADMIN: GET PENDING PRODUCTS =================
  static getPending = async (req, res) => {
    try {
      const products = await ProductModel.find({ status: "pending" })
        .populate("category", "name")
        .populate("vendor", "name businessName email")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch pending products",
      });
    }
  };

  // ================= ADMIN: APPROVE / REJECT PRODUCT =================
  static updateStatus = async (req, res) => {
    try {
      const { status } = req.body; // "approved" or "rejected"

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be 'approved' or 'rejected'",
        });
      }

      const product = await ProductModel.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Product ${status}`,
        product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update product status",
      });
    }
  };

  // ================= VENDOR: GET OWN PRODUCTS =================
  static getMyProducts = async (req, res) => {
    try {
      const products = await ProductModel.find({ vendor: req.user._id })
        .populate("category", "name")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch your products",
      });
    }
  };
}

module.exports = ProductController;