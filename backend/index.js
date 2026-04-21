require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connection = require("./db");

const userRoutes = require("./routes/users");   // Signup
const authRoutes = require("./routes/auth");    // Login
const quizRoutes = require("./routes/quiz");
const courseRoutes = require("./routes/course");

const marketplaceRoutes = require("./routes/marketplace");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const paymentRoutes = require("./routes/payment");
const stateContentRoutes = require("./routes/stateContent");
const translateRoutes = require("./routes/translate");

const app = express();

// 🔹 Database connection
connection();

// 🔹 Middlewares
app.use(express.json());
app.use(cors());

// 🔹 Routes
app.use("/api/users", userRoutes);     // Signup Route
app.use("/api/auth", authRoutes);      // Login Route
app.use("/api/quiz", quizRoutes);
app.use("/api/courses", courseRoutes);
app.use("/uploads", express.static("uploads"));

app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/states", stateContentRoutes);
app.use("/api/translate", translateRoutes);

// 🔹 Default route (optional but useful for testing)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const port = process.env.PORT || 8080;
app.listen(port, () =>
  console.log(`Listening on port ${port}...`)
);

// Triggering restart for Razorpay keys!
