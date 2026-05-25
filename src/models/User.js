const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: String,

    password: {
      type: String,
      required: true,
      select: false,
    },

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

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: Date,
    lastPasswordChangedAt: Date,
  },
  { timestamps: true }
);

// ✅ PASSWORD HASH - NO next()
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// ✅ COMPARE PASSWORD
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);