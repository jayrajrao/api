const UserModel = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
class UserController {
    static createuser = async (req, res) => {
      try {
        const { name, email, password, phone } = req.body;
        const data = new UserModel({
          name: name,
          email: email,
          password: password,
          phone: phone,
        });
        await data.save();
        res.status(201).json({
          success: true,
          data,
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          message: "BAD REQUEST",
        });
        console.log(error);
      }
    };

  static register = async (req, res) => {
    try {
      //console.log(req.body);

      const { name, email, password, cpassword } = req.body;
      const user = await UserModel.findOne({ email: email });
    //  console.log(user);
      if (user) {
        res.status(404).json({
          success: false,
          message: "BAD REQUEST",
        });
      } else {
        if (name && email && password && cpassword) {
          if (password == cpassword) {
            try {
              const hashpassword = await bcrypt.hash(password, 8);
              const result = new UserModel({
                name: name,
                email: email,
                password: hashpassword,
              });
              await result.save();
              // await data.save();
              res.status(201).json({
                success: true,
                result,
              });
            } catch (err) {
              console.log(err);
            }
          } else {
            res.status(404).json({
              success: false,
              message: "BAD REQUEST",
            });
          }
        } else {
          res.status(404).json({
            success: false,
            message: "BAD REQUEST",
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  };
  //   static login = (req, res) => {
  //     //res.send("register")
  //     res.status(201).json({
  //         success: false,
  //         message: "logged in succesfully",
  //       });
  //   };
  static verifylogin = async (req, res) => {
    try {
      //console.log(req.body)
      const { email, password } = req.body;
      if (email && password) {
        const user = await UserModel.findOne({ email: email });
        if (user != null) {
          const ismatched = await bcrypt.compare(password, user.password);
          if (user.email == email && ismatched) {
            //webtoken Generate
            const token = jwt.sign({ id: user._id }, "jayrajrao1");
            console.log(token);
            res.cookie("token", token);
            res.status(201).json({
              success: true,
              message: "success",
            });
          } else {
          
            res.status(404).json({
              success: false,
              message: "BAD REQUEST",
            });
          }
        } else {
        
          res.status(404).json({
            success: false,
            message: "BAD REQUEST You are not registerd user",
          });
        }
      } else {
      
        res.status(404).json({
          success: false,
          message: "try again All Field are required",
        });
      }
    } catch (error) {}
  };

  static logout = async (req, res) => {
    //res.send("register")
    try {
      res.clearCookie("token");
      res.status(404).json({
        success: true,
        message: "logged'in sucessfully",
      });
    } catch (err) {
      console.log(err);
    }
  };
}

module.exports = UserController;
