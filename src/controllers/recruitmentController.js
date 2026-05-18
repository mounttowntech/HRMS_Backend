const JobPost = require("../models/JobPost");
const Candidate = require("../models/Candidate");
const Employee = require("../models/Employee");
exports.createJobPost = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      message: "Job post created",
      job: await JobPost.create({
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id,
      }),
    });
exports.applyCandidate = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      message: "Candidate applied",
      candidate: await Candidate.create({
        ...req.body,
        companyId: req.user.companyId,
        status: "applied",
      }),
    });
exports.resumeScreening = async (req, res) => {
  const status = req.body.selected ? "hr_interview" : "screening_rejected";
  res.json({
    success: true,
    message: status,
    candidate: await Candidate.findOneAndUpdate(
      { _id: req.params.candidateId, companyId: req.user.companyId },
      { status },
      { new: true },
    ),
  });
};
exports.hrInterview = async (req, res) => {
  const passed = req.body.passed;
  res.json({
    success: true,
    message: passed ? "Moved to technical round" : "Candidate rejected",
    candidate: await Candidate.findOneAndUpdate(
      { _id: req.params.candidateId, companyId: req.user.companyId },
      {
        status: passed ? "technical_round" : "screening_rejected",
        hrInterview: {
          status: passed ? "passed" : "failed",
          remarks: req.body.remarks,
        },
      },
      { new: true },
    ),
  });
};
exports.technicalRound = async (req, res) => {
  const passed = req.body.passed;
  res.json({
    success: true,
    message: passed ? "Candidate selected" : "Candidate rejected",
    candidate: await Candidate.findOneAndUpdate(
      { _id: req.params.candidateId, companyId: req.user.companyId },
      {
        status: passed ? "selected" : "technical_rejected",
        technicalRound: {
          status: passed ? "passed" : "failed",
          remarks: req.body.remarks,
        },
      },
      { new: true },
    ),
  });
};
exports.createEmployeeFromCandidate = async (req, res) => {
  const c = await Candidate.findOne({
    _id: req.params.candidateId,
    companyId: req.user.companyId,
  });
  if (!c)
    return res
      .status(404)
      .json({ success: false, message: "Candidate not found" });
  if (c.status !== "selected")
    return res
      .status(400)
      .json({ success: false, message: "Candidate not selected" });
  const count = await Employee.countDocuments({
    companyId: req.user.companyId,
  });
  const emp = await Employee.create({
    companyId: req.user.companyId,
    employeeCode: `EMP${String(count + 1).padStart(4, "0")}`,
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    department: req.body.department,
    designation: req.body.designation,
    role: req.body.role || "employee",
    salary: req.body.salary || 0,
    status: "candidate_selected",
  });
  c.status = "employee_created";
  await c.save();
  res
    .status(201)
    .json({
      success: true,
      message: "Employee created from candidate",
      employee: emp,
    });
};
