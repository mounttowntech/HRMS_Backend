require("dotenv").config();
const mongoose = require("mongoose");
const Company = require("../models/Company");
const User = require("../models/User");
(async () => {
  const mongoURI = process.env.MONGODB_ATLAS || process.env.MONGODB_URI;

await mongoose.connect(mongoURI);
  let company = await Company.findOne({ email: "admin@hrms.com" });
  if (!company)
    company = await Company.create({
      companyName: "Demo HRMS Company",
      industryType: "IT",
      email: "admin@hrms.com",
      phone: "9876543210",
    });
  let user = await User.findOne({ email: "admin@hrms.com" });
  if (!user)
    await User.create({
      companyId: company._id,
      name: "Admin User",
      email: "admin@hrms.com",
      phone: "9876543210",
      password: "Admin@123",
      role: "admin",
    });
  console.log("Seed completed: admin@hrms.com / Admin@123");
  process.exit();
})();
