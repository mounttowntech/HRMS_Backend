const HiringUpdate = require("../models/hiringUpdateModel");

exports.createHiringUpdate = async (req, res) => {
  try {
    const { candidateId, jobPostId, title, message, stage } = req.body;

    const update = await HiringUpdate.create({
      companyId: req.user.companyId,
      candidateId,
      jobPostId,
      title,
      message,
      stage,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Hiring update created successfully",
      data: update,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getRecentHiringUpdates = async (req, res) => {
  try {
    const updates = await HiringUpdate.find({
      companyId: req.user.companyId,
    })
      .populate("candidateId", "fullName email phone")
      .populate("jobPostId", "title position")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: updates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};