const Employee = require("../models/Employee");
const User = require("../models/User");
const Shift = require("../models/shiftModel");
const sendMail = require("../utils/sendMail");
const bcrypt = require("bcryptjs");
const employeeCredentialsTemplate = require("../templates/employeeCredentialTemplate");

// ==============================
// POPULATE EMPLOYEE
// ==============================

const populateEmployee = (query) => {
  return query
    .populate("departmentId", "name")
    .populate("designationId", "name")
    .populate(
      "shiftId",
      "shiftName shiftType startTime endTime graceMinutes weekOff status",
    )
    .populate("reportingManager", "fullName email employeeCode")
    .populate("projectManager", "fullName email employeeCode");
};

// ==============================
// DUPLICATE ERROR HANDLER
// ==============================

const handleDuplicateError = (error, res) => {
  const duplicateField = Object.keys(error.keyPattern || {}).find(
    (key) => key !== "companyId",
  );

  let message = "Duplicate value found";

  if (duplicateField === "email") {
    message = "Employee email already exists";
  } else if (duplicateField === "employeeCode") {
    message = "Employee code already exists. Please try again";
  } else if (duplicateField === "biometricUserId") {
    message = "Biometric user ID already exists. Please try again";
  }

  return res.status(400).json({
    success: false,
    message,
    field: duplicateField,
  });
};

// ==============================
// DUPLICATE-SAFE ID GENERATORz

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
      10,
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

    if (exists) nextNumber++;
  }

  return {
    employeeCode,
    biometricUserId,
  };
};





// CREATE EMPLOYEE + LOGIN USER

exports.createEmployee = async (req, res) => {

  try {

    const {

      fullName,

      email,

      phone,

      joiningDate,

      departmentId,

      designationId,

      shiftId,

      salary,

      role,

      attendanceMode,

      reportingManager,

      projectManager,

      status,

      password,

    } = req.body;



    if (!fullName || !email || !departmentId || !designationId) {

      return res.status(400).json({

        success: false,

        message: "fullName, email, departmentId and designationId are required",

      });

    }



    const normalizedEmail = email.toLowerCase().trim();

    const plainPassword = password || "Welcome@123";



    if (shiftId) {

      const shift = await Shift.findOne({

        _id: shiftId,

        companyId: req.user.companyId,

        status: "active",

      });



      if (!shift) {

        return res.status(404).json({

          success: false,

          message: "Shift not found for this company",

        });

      }

    }



    const existingEmployee = await Employee.findOne({

      companyId: req.user.companyId,

      email: normalizedEmail,

    });



    if (existingEmployee) {

      return res.status(400).json({

        success: false,

        message: "Employee email already exists in this company",

      });

    }



    const existingUser = await User.findOne({

      email: normalizedEmail,

    });



    if (existingUser) {

      return res.status(400).json({

        success: false,

        message: "Login user already exists with this email",

      });

    }



    const { employeeCode, biometricUserId } = await generateEmployeeIds(

      req.user.companyId

    );



    const user = await User.create({

      name: fullName.trim(),

      email: normalizedEmail,

      password: plainPassword,

      phone,

      role: role || "employee",

      companyId: req.user.companyId,

      isActive: true,

    });



    const profileImage = req.file

      ? `/uploads/profile/${req.file.filename}`

      : "";



    const employee = await Employee.create({

      companyId: req.user.companyId,

      userId: user._id,

      employeeCode,

      biometricUserId,

      fullName: fullName.trim(),

      email: normalizedEmail,

      phone,

      profileImage,

      joiningDate: joiningDate || Date.now(),

      departmentId,

      designationId,

      shiftId: shiftId || null,

      salary: salary || 0,

      role: role || "employee",

      attendanceMode: attendanceMode || "employee_login",

      reportingManager: reportingManager || null,

      projectManager: projectManager || null,

      status: status || "active",

    });



    user.employeeId = employee._id;

    await user.save();



    res.status(201).json({

      success: true,

      message: "Employee and login created successfully",

      loginCredentials: {

        email: normalizedEmail,

        password: plainPassword,

      },

      employeeCode,

      biometricUserId,

      employee,

    });

  } catch (error) {

    console.log("CREATE EMPLOYEE ERROR:", error);



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
      }).sort({ createdAt: -1 }),
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
      }),
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
    const employeeId = req.params.id;

    const existingEmployeeData = await Employee.findOne({
      _id: employeeId,
      companyId: req.user.companyId,
    });

    if (!existingEmployeeData) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (req.body.shiftId) {
      const shift = await Shift.findOne({
        _id: req.body.shiftId,
        companyId: req.user.companyId,
        status: "active",
      });

      if (!shift) {
        return res.status(404).json({
          success: false,
          message: "Shift not found for this company",
        });
      }
    }

    const updateData = {
      ...req.body,
    };

    delete updateData.employeeCode;
    delete updateData.biometricUserId;
    delete updateData.userId;
    delete updateData.companyId;
    delete updateData.password;

    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();

      const existingEmployee = await Employee.findOne({
        email: updateData.email,
        companyId: req.user.companyId,
        _id: { $ne: employeeId },
      });

      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: "Employee email already exists",
          field: "email",
        });
      }

      const existingUser = await User.findOne({
        email: updateData.email,
        companyId: req.user.companyId,
        employeeId: { $ne: employeeId },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Login user email already exists",
          field: "email",
        });
      }
    }

    if (req.file) {
      updateData.profileImage = `/uploads/profile/${req.file.filename}`;
    }

    const employee = await populateEmployee(
      Employee.findOneAndUpdate(
        {
          _id: employeeId,
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
      {
        $or: [
          { employeeId: employee._id },
          { _id: employee.userId },
          { email: existingEmployeeData.email },
        ],
        companyId: req.user.companyId,
      },
      {
        name: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        employeeId: employee._id,
        companyId: employee.companyId,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    console.log("UPDATE EMPLOYEE ERROR:", error);

    if (error.code === 11000) {
      return handleDuplicateError(error, res);
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
      companyId: req.user.companyId,
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
