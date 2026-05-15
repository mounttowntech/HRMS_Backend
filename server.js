const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Test Route
app.get("/", (req, res) => {
  res.send("Server is working");
});

// DATABASE
const mongoURI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_ATLAS
    : process.env.MONGODB_LOCAL;

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 8000;

    // ✅ FIXED
    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err.message);
  });