const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const schema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    phone: String,
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "employer",
        "admin",
        "hr",
        "employee",
        "teamlead",
        "projectmanager",
      ],
      default: "employee",
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true },
);
schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
schema.methods.comparePassword = function (p) {
  return bcrypt.compare(p, this.password);
};
module.exports = mongoose.model("User", schema);
