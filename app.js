const express = require("express");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
require("dotenv").config();

const connectdb = require("./db/connectdb");

const app = express();

// ================= Middleware =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// ================= Database =================
connectdb();

// ================= Routes =================
// app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use('/api/user', require("./routes/userRoutes") )
// ================= Server =================
const PORT = process.env.PORT || 3910;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
