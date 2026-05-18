const Task = require("../models/Task");
exports.assignTask = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      message: "Task assigned",
      task: await Task.create({
        ...req.body,
        companyId: req.user.companyId,
        assignedBy: req.user.employeeId,
        status: "assigned",
      }),
    });
exports.startTask = async (req, res) =>
  res.json({
    success: true,
    message: "Task started",
    task: await Task.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { status: "started" },
      { new: true },
    ),
  });
exports.addDailyUpdate = async (req, res) => {
  const task = await Task.findOne({
    _id: req.params.id,
    companyId: req.user.companyId,
  });
  if (!task)
    return res.status(404).json({ success: false, message: "Task not found" });
  task.dailyUpdates.push({
    updateText: req.body.updateText,
    addedBy: req.user.employeeId,
  });
  task.status = "in_progress";
  await task.save();
  res.json({ success: true, message: "Daily update added", task });
};
exports.submitTaskForReview = async (req, res) =>
  res.json({
    success: true,
    message: "Task submitted to Team Lead review",
    task: await Task.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { status: "review" },
      { new: true },
    ),
  });
exports.reviewTask = async (req, res) => {
  const ok = req.body.approved === true;
  res.json({
    success: true,
    message: ok ? "Task closed" : "Task sent for rework",
    task: await Task.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      {
        status: ok ? "closed" : "rework",
        review: {
          reviewedBy: req.user.employeeId,
          status: ok ? "approved" : "rework",
          remarks: req.body.remarks,
        },
      },
      { new: true },
    ),
  });
};
exports.getTasks = async (req, res) => {
  const f = { companyId: req.user.companyId };
  if (req.query.assignedTo) f.assignedTo = req.query.assignedTo;
  if (req.query.projectId) f.projectId = req.query.projectId;
  res.json({
    success: true,
    tasks: await Task.find(f)
      .populate("projectId", "projectName")
      .populate("assignedTo assignedBy", "fullName designation")
      .sort({ createdAt: -1 }),
  });
};
