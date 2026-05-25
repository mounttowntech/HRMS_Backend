const Announcement = require("../models/announcementsModel");

exports.createAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.create({
      companyId: req.user.companyId,
      title: req.body.title,
      message: req.body.message,
      audience: req.body.audience || "all",
      createdBy: req.user.id,
      status: req.body.status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
      status: "active",
    };

    if (req.user.role && req.user.role !== "employer" && req.user.role !== "admin") {
      filter.$or = [{ audience: "all" }, { audience: req.user.role }];
    }

    const announcements = await Announcement.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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
      {
        title: req.body.title,
        message: req.body.message,
        audience: req.body.audience,
        status: req.body.status,
      },
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.json({
      success: true,
      message: "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
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

    res.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};