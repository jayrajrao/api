const CartModel = require("../models/CartModel");
const ProductModel = require("../models/ProductModel");

class CartController {

  // ================= GET USER CART =================
  static getCart = async (req, res) => {
    try {
      const cart = await CartModel.findOne({ user: req.user.id })
        .populate("items.product", "name price images");

      if (!cart) {
        return res.status(200).json({
          success: true,
          cart: {
            items: [],
            totalQuantity: 0,
            totalPrice: 0,
          },
        });
      }

      res.status(200).json({
        success: true,
        cart,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch cart",
      });
    }
  };

  // ================= ADD TO CART =================
  static addToCart = async (req, res) => {
    try {
      const { productId, quantity } = req.body;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID required",
        });
      }

      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      let cart = await CartModel.findOne({ user: req.user.id });

      if (!cart) {
        cart = new CartModel({
          user: req.user.id,
          items: [],
          totalQuantity: 0,
          totalPrice: 0,
        });
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      const qty = quantity ? Number(quantity) : 1;

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += qty;
      } else {
        cart.items.push({
          product: productId,
          quantity: qty,
          price: product.price,
        });
      }

      // Recalculate totals
      cart.totalQuantity = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      await cart.save();

      res.status(200).json({
        success: true,
        message: "Product added to cart",
        cart,
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to add to cart",
      });
    }
  };

  // ================= UPDATE CART ITEM =================
  static updateQuantity = async (req, res) => {
    try {
      const { productId, quantity } = req.body;

      if (!productId || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Valid productId and quantity required",
        });
      }

      const cart = await CartModel.findOne({ user: req.user.id });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        });
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Item not in cart",
        });
      }

      cart.items[itemIndex].quantity = Number(quantity);

      cart.totalQuantity = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      await cart.save();

      res.status(200).json({
        success: true,
        message: "Cart updated",
        cart,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update cart",
      });
    }
  };

  // ================= REMOVE ITEM =================
  static removeItem = async (req, res) => {
    try {
      const { productId } = req.params;

      const cart = await CartModel.findOne({ user: req.user.id });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        });
      }

      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );

      cart.totalQuantity = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      await cart.save();

      res.status(200).json({
        success: true,
        message: "Item removed from cart",
        cart,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to remove item",
      });
    }
  };

  // ================= CLEAR CART =================
  static clearCart = async (req, res) => {
    await CartModel.findOneAndDelete({ user: req.user.id });

    res.status(200).json({
      success: true,
      message: "Cart cleared",
    });
  };
}

module.exports = CartController;
