const mongoose = require("mongoose");
const Shift = require("../models/shiftModel");
exports.createShift = async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId missing in token",
      });
    }

    const shift = await Shift.create({
      companyId: req.user.companyId,
      shiftName: req.body.shiftName,
      shiftType: req.body.shiftType,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      graceMinutes: req.body.graceMinutes || 0,
      weekOff: req.body.weekOff || [],
      status: req.body.status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Shift created successfully",
      shift,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL SHIFTS
exports.getShifts = async (req, res) => {
  try {


    const allShifts = await Shift.find({});

    const shifts = await Shift.find({
      companyId: req.user.companyId,
    });

    res.status(200).json({
      success: true,
      collectionName: Shift.collection.name,
      tokenCompanyId: req.user.companyId,
      totalInThisCollection: allShifts.length,
      count: shifts.length,
      allShifts,
      shifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE SHIFT
exports.getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    res.status(200).json({
      success: true,
      shift,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE SHIFT
exports.updateShift = async (req, res) => {
  try {
    const allowedFields = [
      "shiftName",
      "shiftType",
      "startTime",
      "endTime",
      "graceMinutes",
      "weekOff",
      "status",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (
        req.body[field] !== undefined &&
        req.body[field] !== null &&
        req.body[field] !== ""
      ) {
        updateData[field] = req.body[field];
      }
    });

    const shift = await Shift.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Shift updated successfully",
      shift,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE SHIFT
exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Shift deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};