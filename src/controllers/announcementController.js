const Announcement = require("../models/announcementsModel");

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, description, targetRoles, priority } = req.body;

    const announcement = await Announcement.create({
      companyId: req.user.companyId,
      title,
      description,
      targetRoles,
      priority,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create announcement",
      error: error.message,
    });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const role = req.user.role;

    const announcements = await Announcement.find({
      companyId: req.user.companyId,
      status: "active",
      $or: [
        { targetRoles: { $size: 0 } },
        { targetRoles: role },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
      error: error.message,
    });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      data: announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update announcement",
      error: error.message,
    });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
      error: error.message,
    });
  }
};