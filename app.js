const express = require("express");
const app = express();
const fileUpload = require("express-fileupload");
const cors=require('cors');
// const users_auth = require("./midellware/auth");
const web = require("./routes/web");
const port = 3910;
const bodyParser = require("body-parser");
const cloudinary = require("cloudinary");
app.use(cors())

app.use(fileUpload({ useTempFiles: true }));
//mongodb connection

const connectdb = require("./db/connectdb");
connectdb();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// data get json
app.use(express.json());
//router url
app.use("/api", web);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
