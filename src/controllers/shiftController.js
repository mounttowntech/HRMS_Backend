const Shift = require("../models/shiftModel");

exports.createShift = async (req, res) => {
  try {
    const shift = await Shift.create({
      companyId: req.user.companyId,
      shiftName: req.body.shiftName,
      shiftType: req.body.shiftType,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      graceMinutes: req.body.graceMinutes,
      weekOff: req.body.weekOff,
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

exports.getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find({
      companyId: req.user.companyId,
    });

    res.status(200).json({
      success: true,
      count: shifts.length,
      shifts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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

exports.updateShift = async (req, res) => {
  try {
    const shift = await Shift.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      {
        shiftName: req.body.shiftName,
        shiftType: req.body.shiftType,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        graceMinutes: req.body.graceMinutes,
        weekOff: req.body.weekOff,
        status: req.body.status,
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