const Onboarding = require("../models/Onboarding");
const Employee = require("../models/Employee");
const User = require("../models/User");
const sendMail = require("../utils/sendMail");
exports.startOnboarding = async (req, res) => {
  const emp = await Employee.findOne({
    _id: req.params.employeeId,
    companyId: req.user.companyId,
  });
  if (!emp)
    return res
      .status(404)
      .json({ success: false, message: "Employee not found" });
  emp.status = "onboarding";
  await emp.save();
  const onboarding = await Onboarding.findOneAndUpdate(
    { companyId: req.user.companyId, employeeId: emp._id },
    {
      companyId: req.user.companyId,
      employeeId: emp._id,
      status: "started",
      welcomeCompleted: true,
    },
    { new: true, upsert: true },
  );
  await sendMail({
    to: emp.email,
    subject: "Onboarding Started",
    html: `<h3>Welcome ${emp.fullName}</h3>`,
  });
  res.json({
    success: true,
    message: "Email sent and onboarding started",
    onboarding,
  });
};
exports.updateStep = async (req, res) =>
  res.json({
    success: true,
    message: "Onboarding step updated",
    onboarding: await Onboarding.findOneAndUpdate(
      { companyId: req.user.companyId, employeeId: req.params.employeeId },
      req.body,
      { new: true, upsert: true },
    ),
  });
exports.hrVerify = async (req, res) =>
  res.json({
    success: true,
    message: "HR verification completed",
    onboarding: await Onboarding.findOneAndUpdate(
      { companyId: req.user.companyId, employeeId: req.params.employeeId },
      { hrVerification: true, status: "admin_access" },
      { new: true },
    ),
  });
exports.assignAdminAccessAndActivate = async (req, res) => {
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
  const onboarding = await Onboarding.findOneAndUpdate(
    { companyId: req.user.companyId, employeeId: emp._id },
    {
      adminAccessAssigned: true,
      accountSetup: true,
      status: "completed",
      completedAt: new Date(),
    },
    { new: true },
  );
  await sendMail({
    to: emp.email,
    subject: "HRMS Account Activated",
    html: `<p>Email: ${emp.email}</p><p>Password: ${password}</p>`,
  });
  res.json({
    success: true,
    message: "Admin access assigned and employee active",
    employee: emp,
    onboarding,
  });
};
