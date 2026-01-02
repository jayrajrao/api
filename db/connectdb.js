const mongoose = require("mongoose");

const connectdb = () => {
  return mongoose
    .connect("mongodb+srv://jayrajrao15:ram123@cluster0.cwianhw.mongodb.net/ecommerceapi?retryWrites=true&w=majority")
    .then(() => {
      console.log("connection success");
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = connectdb;
