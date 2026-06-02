const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Company");
const sendMail = require("../utils/sendMail");
const Employee = require("../models/Employee");
const passwordChangedTemplate = require("../templates/passwordChangeTemplate");

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
    },
  );
};

// REGISTER EMPLOYER WITHOUT TOKEN
exports.registerEmployer = async (req, res) => {
  try {
    const { name, email, phone, password, companyName, industryType } =
      req.body;

    const existingUser = await User.findOne({
      email: email?.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: "employer",
      isActive: true,
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

    res.status(201).json({
      success: true,
      message: "Employer and company created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyId: user.companyId,
      },
      company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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

    const employee = await Employee.findOne({
      companyId: user.companyId,

      $or: [
        { _id: user.employeeId || null },

        { userId: user._id },

        { email: user.email },
      ],
    }).select("employeeCode fullName role departmentId designationId");

    const redirectMap = {
      employer: "/employer/dashboard",

      admin: "/admin/dashboard",

      hr: "/hr/dashboard",

      employee: "/employee/dashboard",

      teamlead: "/teamlead/dashboard",

      projectmanager: "/project-manager/dashboard",
    };

    res.status(200).json({
      success: true,

      message: "Login success",

      token: generateToken(user),

      user: {
        id: user._id,

        companyId: user.companyId,

        employeeId: user.employeeId || employee?._id || null,

        employeeCode: employee?.employeeCode || null,

        name: user.name,

        employeeName: employee?.fullName || null,

        email: user.email,

        role: user.role,

        employeeRole: employee?.role || null,

        departmentId: employee?.departmentId || null,

        designationId: employee?.designationId || null,
      },

      redirectTo: redirectMap[user.role] || "/dashboard",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password, new password and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    user.password = newPassword;
    user.lastPasswordChangedAt = new Date();

    await user.save();

    await sendMail({
      to: user.email,
      subject: "HRMS Password Changed Successfully",
      html: passwordChangedTemplate(user.name, "Mounttown HRMS"),
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
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
    user.lastPasswordChangedAt = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// LOGGED IN USER
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("companyId")
      .populate("employeeId");

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
