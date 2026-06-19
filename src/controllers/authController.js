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
    let user = await User.findById(req.user.id)
      .select("-password")
      .populate("companyId")
      .populate({
        path: "employeeId",
        populate: [
          {
            path: "departmentId",
            select: "name departmentName",
          },
          {
            path: "designationId",
            select: "name designationName",
          },
          {
            path: "shiftId",
            select: "shiftName name",
          },
        ],
      });

    let employee = null;

    if (!user.employeeId) {
      employee = await Employee.findOne({
        userId: user._id,
      })
        .populate("departmentId", "name departmentName")
        .populate("designationId", "name designationName")
        .populate("shiftId", "shiftName name");

      if (employee) {
        user.employeeId = employee._id;
        user.companyId = employee.companyId;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      user,
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateRoleBasedProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      phone,
      location,
      address,
      dateOfBirth,
      gender,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    const allowedRoles = [
      "admin",
      "hr",
      "teamlead",
      "projectmanager",
      "employee",
    ];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update profile",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    let employee = await Employee.findOne({
      userId: user._id,
    });

    if (!employee && user.employeeId) {
      employee = await Employee.findById(user.employeeId);
    }

    if (!employee) {
      employee = await Employee.findOne({
        email: user.email,
      });
    }

    if (employee) {
      if (name !== undefined) employee.fullName = name;
      if (phone !== undefined) employee.phone = phone;
      if (location !== undefined) employee.location = location;
      if (address !== undefined) employee.address = address;
      if (dateOfBirth !== undefined) employee.dateOfBirth = dateOfBirth;
      if (gender !== undefined) employee.gender = gender;
      if (emergencyContactName !== undefined) {
        employee.emergencyContactName = emergencyContactName;
      }
      if (emergencyContactPhone !== undefined) {
        employee.emergencyContactPhone = emergencyContactPhone;
      }

      await employee.save();

      if (!user.employeeId) {
        user.employeeId = employee._id;
      }

      if (!user.companyId) {
        user.companyId = employee.companyId;
      }

      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        userId: user._id,
        companyId: user.companyId || employee?.companyId || null,
        employeeId: employee?._id || null,

        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,

        employeeCode: employee?.employeeCode || null,
        employeeName: employee?.fullName || null,
        employeeRole: employee?.role || null,
        departmentId: employee?.departmentId || null,
        designationId: employee?.designationId || null,
        location: employee?.location || "",
        address: employee?.address || "",
        dateOfBirth: employee?.dateOfBirth || null,
        gender: employee?.gender || "",
        emergencyContactName: employee?.emergencyContactName || "",
        emergencyContactPhone: employee?.emergencyContactPhone || "",
        status: employee?.status || null,
      },
    });
  } catch (error) {
    console.log("ROLE BASED PROFILE UPDATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// CREATE PROFILE
exports.createRoleBasedProfile = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const {
      name,
      email,
      phone,
      password,
      role,
      employeeCode,
      departmentId,
      designationId,
    } = req.body;

    const allowedRoles = ["admin", "hr", "teamlead", "projectmanager", "employee"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const existingUser = await User.findOne({
      email: email?.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password: password || "Welcome@123",
      role,
      companyId,
      isActive: true,
    });

    const employee = await Employee.create({
      companyId,
      userId: user._id,
      employeeCode,
      fullName: name,
      email,
      phone,
      role,
      departmentId,
      designationId,
      status: "active",
    });

    user.employeeId = employee._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      user,
      employee,
    });
  } catch (error) {
    console.log("CREATE PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// READ PROFILE BY ID
exports.getRoleBasedProfileById = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const employee = await Employee.findOne({
      _id: req.params.id,
      companyId,
    })
      .populate("userId", "name email phone role isActive")
      .populate("departmentId", "name")
      .populate("designationId", "name");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile: employee,
    });
  } catch (error) {
    console.log("GET PROFILE BY ID ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// UPDATE PROFILE BY ID
exports.updateRoleBasedProfileById = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const {
      name,
      phone,
      role,
      departmentId,
      designationId,
      status,
    } = req.body;

    const employee = await Employee.findOne({
      _id: req.params.id,
      companyId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    if (name !== undefined) employee.fullName = name;
    if (phone !== undefined) employee.phone = phone;
    if (role !== undefined) employee.role = role;
    if (departmentId !== undefined) employee.departmentId = departmentId;
    if (designationId !== undefined) employee.designationId = designationId;
    if (status !== undefined) employee.status = status;

    await employee.save();

    if (employee.userId) {
      const user = await User.findOne({
        _id: employee.userId,
        companyId,
      });

      if (user) {
        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (role !== undefined) user.role = role;

        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: employee,
    });
  } catch (error) {
    console.log("UPDATE PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// DELETE PROFILE BY ID
exports.deleteRoleBasedProfileById = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const employee = await Employee.findOne({
      _id: req.params.id,
      companyId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    if (employee.userId) {
      await User.findOneAndDelete({
        _id: employee.userId,
        companyId,
      });
    }

    await Employee.findOneAndDelete({
      _id: req.params.id,
      companyId,
    });

    res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.log("DELETE PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
