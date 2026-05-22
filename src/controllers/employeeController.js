const Employee = require("../models/Employee");
const User = require("../models/User");
const sendMail = require("../utils/sendMail");

const employeeCredentialsTemplate = require(
  "../templates/employeeCredentialTemplate"
);

// CREATE EMPLOYEE + LOGIN + SEND MAIL
exports.createEmployee = async (req, res) => {
  try {
    const count = await Employee.countDocuments({
      companyId: req.user.companyId,
    });

    const employeeCode =
      req.body.employeeCode || `EMP${String(count + 1).padStart(4, "0")}`;

    const password = req.body.password || "Welcome@123";

    const existingEmployee = await Employee.findOne({
      email: req.body.email,
      companyId: req.user.companyId,
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee already exists with this email",
      });
    }

    const employee = await Employee.create({
      companyId: req.user.companyId,
      employeeCode,
      biometricUserId: req.body.biometricUserId || null,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,

      // updated fields
      departmentId: req.body.departmentId,
      designationId: req.body.designationId,

      salary: req.body.salary || 0,
      role: req.body.role || "employee",
      attendanceMode: req.body.attendanceMode || "employee_login",
      reportingManager: req.body.reportingManager || null,
      projectManager: req.body.projectManager || null,
      joiningDate: req.body.joiningDate,
      status: req.body.status || "active",
    });

    let user = await User.findOne({
      email: employee.email,
    });

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

    const populatedEmployee = await Employee.findById(employee._id)
      .populate("departmentId", "name")
      .populate("designationId", "name")
      .populate("reportingManager", "fullName email employeeCode")
      .populate("projectManager", "fullName email employeeCode");

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL EMPLOYEES
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({
      companyId: req.user.companyId,
    })
      .populate("departmentId", "name")
      .populate("designationId", "name")
      .populate("reportingManager", "fullName email employeeCode")
      .populate("projectManager", "fullName email employeeCode");

    const formattedEmployees = employees.map((emp) => ({
      _id: emp._id,
      companyId: emp.companyId,
      userId: emp.userId,
      employeeCode: emp.employeeCode,
      biometricUserId: emp.biometricUserId,
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,

      departmentId: emp.departmentId?._id || null,
      departmentName: emp.departmentId?.name || null,

      designationId: emp.designationId?._id || null,
      designationName: emp.designationId?.name || null,

      salary: emp.salary,
      role: emp.role,
      attendanceMode: emp.attendanceMode,
      reportingManager: emp.reportingManager,
      projectManager: emp.projectManager,
      status: emp.status,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
    }));

    res.json({
      success: true,
      employees: formattedEmployees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET EMPLOYEE BY ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    })
      .populate("departmentId", "name")
      .populate("designationId", "name")
      .populate("reportingManager", "fullName email employeeCode")
      .populate("projectManager", "fullName email employeeCode");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      employee: {
        _id: employee._id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        email: employee.email,
        phone: employee.phone,

        departmentId: employee.departmentId?._id || null,
        departmentName: employee.departmentId?.name || null,

        designationId: employee.designationId?._id || null,
        designationName: employee.designationId?.name || null,

        salary: employee.salary,
        role: employee.role,
        attendanceMode: employee.attendanceMode,
        reportingManager: employee.reportingManager,
        projectManager: employee.projectManager,
        status: employee.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE EMPLOYEE
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      req.body,
      { new: true }
    )
      .populate("departmentId", "name")
      .populate("designationId", "name")
      .populate("reportingManager", "fullName email employeeCode")
      .populate("projectManager", "fullName email employeeCode");

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

    res.json({
      success: true,
      message: "Employee updated",
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE EMPLOYEE
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

    res.json({
      success: true,
      message: "Employee and login deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};