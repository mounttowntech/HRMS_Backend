const Company = require("../models/Company");
exports.createCompany = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      message: "Company created",
      company: await Company.create({ ...req.body, createdBy: req.user.id }),
    });
exports.getMyCompany = async (req, res) =>
  res.json({
    success: true,
    company: await Company.findById(req.user.companyId),
  });
exports.updateCompany = async (req, res) =>
  res.json({
    success: true,
    message: "Company updated",
    company: await Company.findByIdAndUpdate(req.user.companyId, req.body, {
      new: true,
    }),
  });
