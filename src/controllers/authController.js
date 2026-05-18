const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");
const token = (u) =>
  jwt.sign(
    {
      id: u._id,
      companyId: u.companyId,
      employeeId: u.employeeId,
      role: u.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" },
  );
exports.registerEmployer = async (req, res) => {
  try {
    const { name, email, phone, password, companyName, industryType } =
      req.body;
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: "employer",
    });
    const company = await Company.create({
      companyName,
      industryType,
      email,
      phone,
      createdBy: user._id,
    });
    user.companyId = company._id;
    await user.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Employer and company created",
        token: token(user),
        user,
        company,
      });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await user.comparePassword(password)))
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    if (!user.isActive)
      return res
        .status(403)
        .json({ success: false, message: "Account disabled" });
    user.lastLoginAt = new Date();
    await user.save();
    const m = {
      employer: "/employer/dashboard",
      admin: "/admin/dashboard",
      hr: "/hr/dashboard",
      employee: "/employee/dashboard",
      teamlead: "/teamlead/dashboard",
      projectmanager: "/project-manager/dashboard",
    };
    res.json({
      success: true,
      message: "Login success",
      token: token(user),
      user: {
        id: user._id,
        companyId: user.companyId,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectTo: m[user.role],
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
exports.me = async (req, res) =>
  res.json({
    success: true,
    user: await User.findById(req.user.id)
      .select("-password")
      .populate("companyId employeeId"),
  });
