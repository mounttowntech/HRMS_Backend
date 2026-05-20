const Employee = require("../models/Employee");
const User = require("../models/User");
const sendMail = require("../utils/sendMail");

const employeeCredentialsTemplate = require(
  "../templates/employeeCredentialTemplate"
);
exports.createEmployee = async (req, res) => {
  try {
    const count = await Employee.countDocuments({
      companyId: req.user.companyId,
    });
    const employee = await Employee.create({
      ...req.body,
      companyId: req.user.companyId,
      employeeCode: `EMP${String(count + 1).padStart(4, "0")}`,
    });
    res
      .status(201)
      .json({ success: true, message: "Employee added", employee });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createEmployeeLogin = async (req, res) => {
  try {
    const employee = await Employee.findById(
      req.params.employeeId
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // check already linked
    if (employee.userId) {
      return res.status(400).json({
        success: false,
        message: "Login already created",
      });
    }

    // default password
    const password = "Welcome@123";

    // create user
    const user = await User.create({
      companyId: employee.companyId,
      employeeId: employee._id,
      name: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      password,
      role: employee.role || "employee",
    });

    // update employee
    employee.userId = user._id;

    employee.status = "active";

    await employee.save();

    // SEND EMAIL TEMPLATE
    await sendMail({
      to: employee.email,
      subject: "Employee Login Credentials",
      html: employeeCredentialsTemplate(
        employee.fullName,
        employee.email,
        password,
        "Mounttown Technologies"
      ),
    });

    return res.status(201).json({
      success: true,
      message:
        "Employee login created and email sent",
      user,
      employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({
      companyId: req.user.companyId,
    })
      .populate("reportingManager", "fullName email role designation")
      .populate("projectManager", "fullName email role designation")
      .populate("userId", "name email role isActive");

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
exports.getEmployeeById = async (req, res) =>
  res.json({
    success: true,
    employee: await Employee.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    }),
  });


exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "reportingManager",
        "fullName email designation"
      )
      .populate(
        "projectManager",
        "fullName email designation"
      );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};