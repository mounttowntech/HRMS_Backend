const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Employee = require("../models/Employee");
const Onboarding = require("../models/Onboarding");

const generateEmployeeCode = async () => {
  const count = await Employee.countDocuments();
  return `EMP${String(count + 1).padStart(4, "0")}`;
};

exports.createEmployee = async (req, res) => {
  try {
    const {
      userName,
      email,
      password,
      fullName,
      phone,
      gender,
      dateOfBirth,
      department,
      designation,
      reportingManager,
      joiningDate,
    } = req.body;

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userName,
      email,
      password: hashedPassword,
      role: designation,
    });

    const employeeCode = await generateEmployeeCode();

    const employee = await Employee.create({
      userId: user._id,
      employeeCode,
      fullName,
      phone,
      gender,
      dateOfBirth,
      department,
      designation,
      reportingManager,
      joiningDate,
      employeeStatus: "Inactive",
    });

    await Onboarding.create({
      employeeId: employee._id,
      status: "Employee Created",
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
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

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("userId", "userName email role isActive")
      .populate("reportingManager", "userName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.user.id,
    }).populate("userId", "userName email role");

    res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};