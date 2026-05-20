const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      companyId: user.companyId,
      employeeId: user.employeeId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};
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




// LOGIN
exports.login = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Wrong password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account disabled",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const redirectMap = {
      employer: "/employer/dashboard",
      admin: "/admin/dashboard",
      hr: "/hr/dashboard",
      employee: "/employee/dashboard",
      teamlead: "/teamlead/dashboard",
      projectmanager: "/project-manager/dashboard",
    };

    return res.status(200).json({
      success: true,
      message: "Login success",
      token: generateToken(user),
      user: {
        id: user._id,
        companyId: user.companyId,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectTo: redirectMap[user.role],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// RESET PASSWORD TEMPORARY
exports.resetPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const newPassword = req.body.password?.trim();

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.me = async (req, res) =>
  res.json({
    success: true,
    user: await User.findById(req.user.id)
      .select("-password")
      .populate("companyId employeeId"),
  });
