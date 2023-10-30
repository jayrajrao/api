const mongoose = require("mongoose");

var jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    } ,
    email: {
      type: String,
      required: true,
    },
    // phone: {
    //   type: Number,
    //   required:true,
    // },
    password: {
      type: String,
      required:true
    },
    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    // },
  //  cpassword:{
  //   type:String,
  //   required:true
  //  }
  
  },
  
);
let UserModel = mongoose.model("user", UserSchema);
module.exports = UserModel;
