const Employee = require("../models/Employee");
const User = require("../models/User");
const sendMail = require("../utils/sendMail");
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
    const emp = await Employee.findOne({
      _id: req.params.employeeId,
      companyId: req.user.companyId,
    });
    if (!emp)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    const password = req.body.password || "Welcome@123";
    let user = await User.findOne({ email: emp.email });
    if (!user)
      user = await User.create({
        companyId: emp.companyId,
        employeeId: emp._id,
        name: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        password,
        role: emp.role,
      });
    emp.userId = user._id;
    emp.status = "active";
    await emp.save();
    await sendMail({
      to: emp.email,
      subject: "HRMS Login Credentials",
      html: `<p>Email: ${emp.email}</p><p>Password: ${password}</p>`,
    });
    res.json({
      success: true,
      message: "Employee login created and email sent",
      employee: emp,
      user,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
exports.getEmployees = async (req, res) =>
  res.json({
    success: true,
    employees: await Employee.find({ companyId: req.user.companyId })
      .populate("reportingManager projectManager", "fullName email")
      .sort({ createdAt: -1 }),
  });
exports.getEmployeeById = async (req, res) =>
  res.json({
    success: true,
    employee: await Employee.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    }),
  });
exports.updateEmployee = async (req, res) =>
  res.json({
    success: true,
    message: "Employee updated",
    employee: await Employee.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      req.body,
      { new: true },
    ),
  });
