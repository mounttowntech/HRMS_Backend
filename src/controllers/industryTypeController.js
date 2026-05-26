const IndustryType = require("../models/industryType");

// ======================================
// CREATE INDUSTRY TYPE
// ======================================
exports.createIndustryType = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    // Check existing industry type
    const existingIndustry = await IndustryType.findOne({
      name: name.trim(),
    });

    if (existingIndustry) {
      return res.status(400).json({
        success: false,
        message: "Industry type already exists",
      });
    }

    const industryType = await IndustryType.create({
      name,
      description,
      status,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Industry type created successfully",
      industryType,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create industry type",
      error: error.message,
    });
  }
};

// ======================================
// GET ALL INDUSTRY TYPES
// ======================================
exports.getIndustryTypes = async (req, res) => {
  try {
    const industryTypes = await IndustryType.find()

      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      count: industryTypes.length,
      industryTypes,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch industry types",
      error: error.message,
    });
  }
};

// ======================================
// GET SINGLE INDUSTRY TYPE
// ======================================
exports.getSingleIndustryType = async (req, res) => {
  try {
    const industryType = await IndustryType.findById(req.params.id)

      .populate("createdBy", "name email role");

    if (!industryType) {
      return res.status(404).json({
        success: false,
        message: "Industry type not found",
      });
    }

    res.status(200).json({
      success: true,
      industryType,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch industry type",
      error: error.message,
    });
  }
};

// ======================================
// UPDATE INDUSTRY TYPE
// ======================================
exports.updateIndustryType = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    // Check duplicate name
    if (name) {
      const existingIndustry = await IndustryType.findOne({
        name: name.trim(),
        _id: { $ne: req.params.id },
      });

      if (existingIndustry) {
        return res.status(400).json({
          success: false,
          message: "Industry type already exists",
        });
      }
    }

    const industryType = await IndustryType.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("createdBy", "name email role");

    if (!industryType) {
      return res.status(404).json({
        success: false,
        message: "Industry type not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Industry type updated successfully",
      industryType,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update industry type",
      error: error.message,
    });
  }
};

// ======================================
// DELETE INDUSTRY TYPE
// ======================================
exports.deleteIndustryType = async (req, res) => {
  try {
    const industryType = await IndustryType.findById(req.params.id);

    if (!industryType) {
      return res.status(404).json({
        success: false,
        message: "Industry type not found",
      });
    }

    await industryType.deleteOne();

    res.status(200).json({
      success: true,
      message: "Industry type deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete industry type",
      error: error.message,
    });
  }
};