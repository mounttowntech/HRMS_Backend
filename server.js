require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGODB_ATLAS;


mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.log("MONGO ERROR NAME:", err.name);
    console.log("MONGO ERROR MESSAGE:", err.message);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});