const mongoose = require("mongoose");
const mongoURI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_ATLAS
    : process.env.MONGODB_LOCAL;

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(
        `🚀 Server running on ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.log(err.message);
  });
