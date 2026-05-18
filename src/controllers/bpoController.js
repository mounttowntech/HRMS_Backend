const BpoProcess = require("../models/BpoProcess");
exports.startVoiceTraining = async (req, res) =>
  res.json({
    success: true,
    message: "Voice training started",
    process: await BpoProcess.findOneAndUpdate(
      { companyId: req.user.companyId, employeeId: req.params.employeeId },
      {
        companyId: req.user.companyId,
        employeeId: req.params.employeeId,
        status: "training",
      },
      { new: true, upsert: true },
    ),
  });
exports.assignProcessAndShift = async (req, res) =>
  res.json({
    success: true,
    message: "Process and shift assigned",
    process: await BpoProcess.findOneAndUpdate(
      { companyId: req.user.companyId, employeeId: req.params.employeeId },
      {
        processName: req.body.processName,
        shift: req.body.shift,
        status: "shift_assigned",
      },
      { new: true, upsert: true },
    ),
  });
exports.mockCallResult = async (req, res) => {
  const ok = req.body.passed === true;
  res.json({
    success: true,
    message: ok ? "Moved to live process" : "Moved to retraining",
    process: await BpoProcess.findOneAndUpdate(
      { companyId: req.user.companyId, employeeId: req.params.employeeId },
      {
        mockCallStatus: ok ? "passed" : "failed",
        status: ok ? "live_process" : "retraining",
        voiceTrainingCompleted: ok,
      },
      { new: true },
    ),
  });
};
exports.getBpoProcesses = async (req, res) =>
  res.json({
    success: true,
    processes: await BpoProcess.find({
      companyId: req.user.companyId,
    }).populate("employeeId", "fullName email"),
  });
