const Document = require("../models/Document");
exports.uploadDocument = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      message: "Document uploaded",
      document: await Document.create({
        ...req.body,
        companyId: req.user.companyId,
        employeeId: req.user.employeeId || req.body.employeeId,
      }),
    });
exports.verifyDocument = async (req, res) =>
  res.json({
    success: true,
    message: "Document verification updated",
    document: await Document.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      {
        status: req.body.status || "verified",
        verifiedBy: req.user.employeeId,
        remarks: req.body.remarks,
      },
      { new: true },
    ),
  });
exports.getDocuments = async (req, res) => {
  const f = { companyId: req.user.companyId };
  if (req.query.employeeId) f.employeeId = req.query.employeeId;
  res.json({
    success: true,
    documents: await Document.find(f)
      .populate("employeeId", "fullName email")
      .sort({ createdAt: -1 }),
  });
};
