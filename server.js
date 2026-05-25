require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");


const mongoURI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_ATLAS
    : process.env.MONGODB_LOCAL;

if (!mongoURI) {
  console.log("❌ MongoDB URI missing");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("MONGODB_LOCAL:", process.env.MONGODB_LOCAL);
  console.log("MONGODB_ATLAS:", process.env.MONGODB_ATLAS);
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB Error:", err.message);
  });
  