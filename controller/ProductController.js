const cloudinary = require("cloudinary").v2;
const ProductModel = require("../models/ProductModel");

// ================= Cloudinary Config =================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class ProductController {

  // ================= CREATE PRODUCT =================
static create = async (req, res) => {
  try {
    const { name, description, price, category, stock, productID } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
    }

    if (!req.files || !req.files.images) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    // ✅ upload to cloudinary
    const uploadImage = await cloudinary.uploader.upload(
      req.files.images.tempFilePath,
      {
        folder: "productimage",
        unique_filename: true,
        overwrite: false,
      }
    );

    // ✅ ALWAYS ARRAY (important)
    const product = await ProductModel.create({
      name,
      description,
      price,
      category,
      stock,
      productID,
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


static getAll = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    // ⭐ support BOTH keyword and search
    const keyword =
      req.query.keyword?.trim() ||
      req.query.search?.trim();

    const category = req.query.category?.trim();
    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    const sort = req.query.sort;

    const query = {};

    // ✅ keyword filter
    if (keyword) {
      query.name = { $regex: keyword, $options: "i" };
    }

    // ✅ category filter (case-insensitive)
    if (category) {
      query.category = { $regex: `^${category}$`, $options: "i" };
    }

    // ✅ price filter
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      query.price = {};
      if (!isNaN(minPrice)) query.price.$gte = minPrice;
      if (!isNaN(maxPrice)) query.price.$lte = maxPrice;
    }

    // ================= SORTING (⭐ FIXED) =================
    let sortOption = { createdAt: -1 };

    if (sort === "price_asc") {
      sortOption = { price: 1 };
    }

    if (sort === "price_desc") {
      sortOption = { price: -1 };
    }

    console.log("FINAL QUERY:", query);

    const products = await ProductModel.find(query)
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

      let imageData = product.images;

      // If new image uploaded
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

      await ProductModel.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        stock: req.body.stock,
        images: imageData,
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
