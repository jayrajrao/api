const express = require("express");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectdb = require("./db/connectdb");
const seedAdmin = require("./utils/seedAdmin");

const app = express();

// ================= Required env check (fail fast) =================
const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`❌ Missing required env vars: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// ================= Trust proxy =================
// Needed behind Render/Heroku/Nginx etc. so secure cookies + rate-limit IPs work correctly
app.set("trust proxy", 1);

// ================= Security middleware =================
app.use(helmet());

// CORS — cookie-based auth needs a specific origin allow-list, not "*"
const allowedOrigins = (process.env.CLIENT_URLS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Body parsing with sane size limits
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// NoSQL injection protection (strips $ and . from req.body/query/params keys)
app.use(mongoSanitize());

// File upload with limits — prevents unbounded upload DoS
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
    abortOnLimit: true,
    responseOnLimit: JSON.stringify({
      success: false,
      message: "File too large (max 5MB)",
    }),
  })
);

// Rate limiting — auth endpoints are the main brute-force target
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later",
  },
});
app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);

// General API rate limit (looser, covers everything else)
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ================= Routes =================
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));

// ================= 404 handler =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ================= Global error handler =================
// Catches CORS rejection + anything passed to next(err) that controllers didn't handle
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS: origin not allowed",
    });
  }
  res.status(err.status || 500).json({
    success: false,
    message: "Something went wrong",
  });
});

// ================= Bootstrap (DB first, then seed, then listen) =================
const PORT = process.env.PORT || 3910;

const start = async () => {
  try {
    await connectdb();
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

start();