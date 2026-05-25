const Company = require("../models/Company");
const IndustryType = require("../models/industryType");

// ======================================
// CREATE COMPANY
// ======================================
exports.createCompany = async (req, res) => {
  try {
    const {
      companyName,
      industryTypeId,
      email,
      phone,
      address,
      website,
      status,
    } = req.body;

    // Check Industry Type exists
    const industryType = await IndustryType.findById(industryTypeId);

    if (!industryType) {
      return res.status(404).json({
        success: false,
        message: "Industry Type not found",
      });
    }

    const company = await Company.create({
      companyName,
      industryTypeId,
      email,
      phone,
      address,
      website,
      status,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      company,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create company",
      error: error.message,
    });
  }
};

// ======================================
// GET ALL COMPANIES
// ======================================
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find()

      .populate("industryTypeId", "name description")

      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch companies",
      error: error.message,
    });
  }
};

// ======================================
// GET SINGLE COMPANY
// ======================================
exports.getSingleCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)

      .populate("industryTypeId", "name description")

      .populate("createdBy", "name email role");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      company,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch company",
      error: error.message,
    });
  }
};

// ======================================
// UPDATE COMPANY
// ======================================
exports.updateCompany = async (req, res) => {
  try {
    const {
      companyName,
      industryTypeId,
      email,
      phone,
      address,
      website,
      status,
    } = req.body;

    // Check Industry Type exists
    if (industryTypeId) {
      const industryType = await IndustryType.findById(industryTypeId);

      if (!industryType) {
        return res.status(404).json({
          success: false,
          message: "Industry Type not found",
        });
      }
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      {
        companyName,
        industryTypeId,
        email,
        phone,
        address,
        website,
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("industryTypeId", "name description")
      .populate("createdBy", "name email role");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      company,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update company",
      error: error.message,
    });
  }
};

// ======================================
// DELETE COMPANY
// ======================================
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete company",
      error: error.message,
    });
  }
};