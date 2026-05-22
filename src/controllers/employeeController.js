const Employee = require("../models/Employee");
const User = require("../models/User");
const Shift = require("../models/shiftModel");
const sendMail = require("../utils/sendMail");

const employeeCredentialsTemplate = require(
  "../templates/employeeCredentialTemplate"
);

// ==============================
// POPULATE EMPLOYEE
// ==============================
const populateEmployee = (query) => {
  return query
    .populate("departmentId", "name")
    .populate("designationId", "name")
    .populate(
      "shiftId",
      "shiftName shiftType startTime endTime graceMinutes weekOff status"
    )
    .populate("reportingManager", "fullName email employeeCode")
    .populate("projectManager", "fullName email employeeCode");
};

// ==============================
// DUPLICATE-SAFE ID GENERATOR
// ==============================
const generateEmployeeIds = async (companyId) => {
  let nextNumber = 1;
  let employeeCode;
  let biometricUserId;
  let exists = true;

  const lastEmployee = await Employee.findOne({ companyId })
    .sort({ createdAt: -1 })
    .select("employeeCode");

  if (lastEmployee?.employeeCode) {
    const lastNumber = parseInt(
      lastEmployee.employeeCode.replace("EMP", ""),
      10
    );

    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  while (exists) {
    const padded = String(nextNumber).padStart(4, "0");

    employeeCode = `EMP${padded}`;
    biometricUserId = `BIO${padded}`;

    exists = await Employee.findOne({
      companyId,
      $or: [{ employeeCode }, { biometricUserId }],
    });

    if (exists) {
      nextNumber++;
    }
  }

  return {
    employeeCode,
    biometricUserId,
  };
};

// ==============================
// CREATE EMPLOYEE
// ==============================
exports.createEmployee = async (req, res) => {
  try {
    const { employeeCode, biometricUserId } = await generateEmployeeIds(
      req.user.companyId
    );

    const password = req.body.password || "Welcome@123";

    const email = req.body.email?.trim().toLowerCase();

    if (!email || !req.body.fullName || !req.body.departmentId || !req.body.designationId) {
      return res.status(400).json({
        success: false,
        message: "fullName, email, departmentId and designationId are required",
      });
    }

    const existingEmployee = await Employee.findOne({
      email,
      companyId: req.user.companyId,
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee already exists with this email",
      });
    }

    if (req.body.shiftId) {
      const shift = await Shift.findOne({
        _id: req.body.shiftId,
        companyId: req.user.companyId,
      });

      if (!shift) {
        return res.status(404).json({
          success: false,
          message: "Shift not found",
        });
      }
    }

    const profileImage = req.file
      ? `/uploads/profile/${req.file.filename}`
      : "";

    const employee = await Employee.create({
      companyId: req.user.companyId,
      employeeCode,
      biometricUserId,
      fullName: req.body.fullName,
      email,
      phone: req.body.phone,
      profileImage,
      joiningDate: req.body.joiningDate || Date.now(),
      shiftId: req.body.shiftId || null,
      departmentId: req.body.departmentId,
      designationId: req.body.designationId,
      salary: req.body.salary || 0,
      role: req.body.role || "employee",
      attendanceMode: req.body.attendanceMode || "employee_login",
      reportingManager: req.body.reportingManager || null,
      projectManager: req.body.projectManager || null,
      status: req.body.status || "active",
      leaveBalance: req.body.leaveBalance || {
        sick: 10,
        casual: 12,
        earned: 15,
      },
    });

    let user = await User.findOne({ email: employee.email });

    if (!user) {
      user = await User.create({
        companyId: employee.companyId,
        employeeId: employee._id,
        name: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        password,
        role: employee.role,
        isActive: true,
      });
    }

    employee.userId = user._id;
    await employee.save();

    await sendMail({
      to: employee.email,
      subject: "HRMS Login Credentials",
      html: employeeCredentialsTemplate(
        employee.fullName,
        employee.email,
        password,
        "Mounttown HRMS"
      ),
    });

    const populatedEmployee = await populateEmployee(
      Employee.findById(employee._id)
    );

    res.status(201).json({
      success: true,
      message: "Employee created and login credentials sent",
      employee: populatedEmployee,
      login: {
        email: employee.email,
        password,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Duplicate employeeCode, biometricUserId or email. Please try again.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET ALL EMPLOYEES
// ==============================
exports.getEmployees = async (req, res) => {
  try {
    const employees = await populateEmployee(
      Employee.find({
        companyId: req.user.companyId,
      }).sort({ createdAt: -1 })
    );

    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET EMPLOYEE BY ID
// ==============================
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await populateEmployee(
      Employee.findOne({
        _id: req.params.id,
        companyId: req.user.companyId,
      })
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

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

// ==============================
// UPDATE EMPLOYEE
// ==============================
exports.updateEmployee = async (req, res) => {
  try {
    if (req.body.shiftId) {
      const shift = await Shift.findOne({
        _id: req.body.shiftId,
        companyId: req.user.companyId,
      });

      if (!shift) {
        return res.status(404).json({
          success: false,
          message: "Shift not found",
        });
      }
    }

    const updateData = {
      ...req.body,
    };

    delete updateData.employeeCode;
    delete updateData.biometricUserId;

    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
    }

    if (req.file) {
      updateData.profileImage = `/uploads/profile/${req.file.filename}`;
    }

    const employee = await populateEmployee(
      Employee.findOneAndUpdate(
        {
          _id: req.params.id,
          companyId: req.user.companyId,
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await User.findOneAndUpdate(
      { employeeId: employee._id },
      {
        name: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
      }
    );

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate email or unique field found",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// DELETE EMPLOYEE
// ==============================
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await User.findOneAndDelete({
      employeeId: employee._id,
    });

    res.status(200).json({
      success: true,
      message: "Employee and login deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};