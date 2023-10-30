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

//produt curd method
class ProdutController {
  static create = async (req, res) => {
    //console.log(req.body);
    const file = req.files.images;
    const myimage = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "productimage",
    });
    // console.log(myimage)
    try {
      const { name, description, price, rating, category, Stock, images,productID } =
        req.body;
      const data1 = new ProductModel({
        name: name,
        description: description,
        price: price,
        rating: rating,
        category: category,
        Stock: Stock,
        productID:productID,
        // numOfReviews:numOfReviews,
        // reviews:reviews,
        images: {
          public_id: myimage.public_id,
          url: myimage.secure_url,
        },
      });
      await data1.save();
      res.status(201).json({
        success: true,
        data1,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: "BAD REQUEST",
      });
      console.log(error);
    }
  };
  static display = async (req, res) => {
    try {
      const data1 = await ProductModel.find();
      res.status(200).json({
        status: "success",
        data1,
      });
      // console.log(data1);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
    }
  };

  static update = async (req, res) => {
    //console.log(req.params.id)
    try {
      //console.log(req.files.image
      if (req.files) {
        const file = req.files.images;
        const myimage = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "productimage",
        });
        const data1 = await ProductModel.findById(req.params.id);
        // console.log(data1)
        const ObjectId = data1.images.public_id;
        //console.log( ObjectId)
        await cloudinary.uploader.destroy(myimage);

        var imgdata = {
          name: req.body.name,
          description: req.body.description,
          price: req.body.price,
          stock: req.body.stock,
          rating: req.body.rating,
          category: req.body.category,
          
          images: {
            public_id: myimage.public_id,
            url: myimage.secure_url,
          },
        };
      } else {
        var imgdata = {
          name: req.body.name,
          description: req.body.description,
          price: req.body.price,
          stock: req.body.stock,
          rating: req.body.rating,
          category: req.body.category,
        };
      }
      //console.log(req.params.id)
      //console.log(req.body)
      const result = await ProductModel.findByIdAndUpdate(
        req.params.id,
        imgdata
      );
      await result.save();
      res
        .status(201)
        .json({ status: "Success", message: "product Update successfully" });
    } catch (error) {
      console.log(error);
    }
  };

  static view = async (req, res) => {
    try {
      const data1 = await ProductModel.findById(req.params.id);
      res.status(200).json({
        success: true,
        data1,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
      console.log(error);
    }
  };
  static delete = async (req, res) => {
    try {
      const data1 = await ProductModel.findByIdAndDelete(req.params.id);
      res.status(200).json({
        success: true,
        message: "DELEATED SUCCESFULLY",
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: "Product Not Found",
      });
      console.log(eror);
    }
  };
}
module.exports = ProdutController;
