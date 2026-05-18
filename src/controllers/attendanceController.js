const Attendance = require("../models/Attendance");
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
exports.punchIn = async (req, res) => {
  const employeeId = req.user.employeeId || req.body.employeeId;
  const attendance = await Attendance.findOneAndUpdate(
    { companyId: req.user.companyId, employeeId, date: today() },
    {
      companyId: req.user.companyId,
      employeeId,
      date: today(),
      punchIn: new Date(),
      workStartedAt: new Date(),
      status: "present",
    },
    { new: true, upsert: true },
  );
  res.json({
    success: true,
    message: "Punch in saved and work started",
    attendance,
  });
};
exports.startBreak = async (req, res) => {
  const employeeId = req.user.employeeId || req.body.employeeId;
  const a = await Attendance.findOne({
    companyId: req.user.companyId,
    employeeId,
    date: today(),
  });
  if (!a)
    return res.status(400).json({ success: false, message: "Punch in first" });
  a.breaks.push({ breakIn: new Date() });
  await a.save();
  res.json({ success: true, message: "Break started", attendance: a });
};
exports.endBreak = async (req, res) => {
  const employeeId = req.user.employeeId || req.body.employeeId;
  const a = await Attendance.findOne({
    companyId: req.user.companyId,
    employeeId,
    date: today(),
  });
  if (!a)
    return res.status(400).json({ success: false, message: "Punch in first" });
  const b = a.breaks[a.breaks.length - 1];
  if (!b || b.breakOut)
    return res.status(400).json({ success: false, message: "No active break" });
  b.breakOut = new Date();
  b.minutes = Math.floor((b.breakOut - b.breakIn) / 60000);
  await a.save();
  res.json({ success: true, message: "Break ended", attendance: a });
};
exports.punchOut = async (req, res) => {
  const employeeId = req.user.employeeId || req.body.employeeId;
  const a = await Attendance.findOne({
    companyId: req.user.companyId,
    employeeId,
    date: today(),
  });
  if (!a || !a.punchIn)
    return res.status(400).json({ success: false, message: "Punch in first" });
  a.punchOut = new Date();
  const bm = a.breaks.reduce((s, b) => s + (b.minutes || 0), 0);
  a.workingMinutes = Math.max(
    0,
    Math.floor((a.punchOut - a.punchIn) / 60000) - bm,
  );
  if (a.workingMinutes < 240) a.status = "half_day";
  await a.save();
  res.json({
    success: true,
    message: "Punch out saved, working hours calculated, attendance saved",
    attendance: a,
  });
};
exports.getAttendance = async (req, res) => {
  const f = { companyId: req.user.companyId };
  if (req.query.employeeId) f.employeeId = req.query.employeeId;
  res.json({
    success: true,
    attendance: await Attendance.find(f)
      .populate("employeeId", "fullName department designation")
      .sort({ date: -1 }),
  });
};
