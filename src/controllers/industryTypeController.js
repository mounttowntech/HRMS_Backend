const IndustryType = require("../models/industryType");

exports.createIndustryType = async (req, res) => {
  try {
    const { name, description } = req.body;

    const industryType = await IndustryType.create({
      companyId: req.user.companyId,
      name,
      description,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Industry type created successfully",
      industryType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getIndustryTypes = async (req, res) => {
  try {
    const industryTypes = await IndustryType.find({
      companyId: req.user.companyId,
    });

    res.status(200).json({
      success: true,
      industryTypes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getIndustryTypeById = async (req, res) => {
  try {
    const industryType = await IndustryType.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateIndustryType = async (req, res) => {
  try {
    const industryType = await IndustryType.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Industry type updated successfully",
      industryType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteIndustryType = async (req, res) => {
  try {
    await IndustryType.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    res.status(200).json({
      success: true,
      message: "Industry type deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};