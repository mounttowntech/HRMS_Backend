const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Company = require("../models/Company");
const Employee = require("../models/Employee");

const sendMail = require("../utils/sendMail");
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
    { expiresIn: "7d" }
  );
};

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



    let isMatch = false;



    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {

      isMatch = await user.comparePassword(password);

    } else {

      isMatch = password === user.password;



      if (isMatch) {

        user.password = password;

        await user.save();

      }

    }



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

    console.log("LOGIN ERROR:", error);



    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};
exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOTP = otp;
    user.resetOTPExpire = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    await sendMail({
      to: user.email,
      subject: "HRMS Password Reset OTP",
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Reset Password OTP</h2>
          <p>Hello ${user.name || user.email},</p>
          <p>Your OTP is:</p>
          <h1 style="color:#2563eb">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
          <br/>
          <p>Mounttown HRMS Team</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      !user.resetOTP ||
      user.resetOTP !== otp ||
      !user.resetOTPExpire ||
      user.resetOTPExpire < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const resetToken = jwt.sign(
      {
        userId: user._id,
        purpose: "RESET_PASSWORD",
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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
    console.log("CHANGE PASSWORD ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // ← THIS WAS MISSING — fetch user from resetToken
    const userId = req.user.id || req.user.userId;
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = newPassword;
    user.lastPasswordChangedAt = new Date();
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
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