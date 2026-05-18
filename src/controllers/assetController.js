const Asset = require("../models/Asset");
const AccessRequest = require("../models/AccessRequest");
exports.createAsset = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      message: "Asset created",
      asset: await Asset.create({ ...req.body, companyId: req.user.companyId }),
    });
exports.assignAsset = async (req, res) =>
  res.json({
    success: true,
    message: "Laptop/asset assigned",
    asset: await Asset.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      {
        employeeId: req.body.employeeId,
        assignedDate: new Date(),
        status: "assigned",
      },
      { new: true },
    ),
  });
exports.createAccess = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      message: "Access created",
      access: await AccessRequest.create({
        ...req.body,
        companyId: req.user.companyId,
        status: "active",
      }),
    });
exports.getAssets = async (req, res) =>
  res.json({
    success: true,
    assets: await Asset.find({ companyId: req.user.companyId }).populate(
      "employeeId",
      "fullName email",
    ),
  });
