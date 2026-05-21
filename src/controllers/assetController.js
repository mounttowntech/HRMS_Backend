const Asset = require("../models/Asset");
const AccessRequest = require("../models/AccessRequest");

// CREATE ASSET
exports.createAsset = async (req, res) => {
  try {
    const asset = await Asset.create({
      ...req.body,
      companyId: req.user.companyId,
    });

    res.status(201).json({
      success: true,
      message: "Asset created",
      asset,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ASSIGN ASSET TO EMPLOYEE
exports.assignAsset = async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      {
        employeeId: req.body.employeeId,
        assignedDate: new Date(),
        status: "assigned",
      },
      { new: true }
    );

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    res.json({
      success: true,
      message: "Laptop/asset assigned",
      asset,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE ACCESS
exports.createAccess = async (req, res) => {
  try {
    const access = await AccessRequest.create({
      ...req.body,
      companyId: req.user.companyId,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Access created",
      access,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL ASSETS
exports.getAllAssets = async (req, res) => {
  try {
    const assets = await Asset.find({
      companyId: req.user.companyId,
    })
      .populate("employeeId", "fullName email phone department designation")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assets.length,
      assets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL ACCESS
exports.getAllAccess = async (req, res) => {
  try {
    const accessRequests = await AccessRequest.find({
      companyId: req.user.companyId,
    })
      .populate("employeeId", "fullName email phone department designation")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: accessRequests.length,
      accessRequests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};