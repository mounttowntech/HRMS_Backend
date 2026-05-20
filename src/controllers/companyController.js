const Company = require("../models/Company");
exports.createCompany = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      message: "Company created",
      company: await Company.create({ ...req.body, createdBy: req.user.id }),
    });

// GET ALL COMPANIES


exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find()

      .populate(
        "createdBy",
        "name email role"
      )

      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,

      count: companies.length,

      companies,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,

      message:
        "Failed to fetch companies",

      error: error.message,
    });
  }
};


// GET SINGLE COMPANY
exports.getSingleCompany =
  async (req, res) => {
    try {
      const company =
        await Company.findById(
          req.params.id
        ).populate(
          "createdBy",
          "name email role"
        );

      if (!company) {
        return res.status(404).json({
          success: false,

          message:
            "Company not found",
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

        message:
          "Failed to fetch company",

        error: error.message,
      });
    }
  };
exports.updateCompany = async (req, res) =>
  res.json({
    success: true,
    message: "Company updated",
    company: await Company.findByIdAndUpdate(req.user.companyId, req.body, {
      new: true,
    }),
  });


  
// DELETE COMPANY
 

exports.deleteCompany = async (
  req,
  res
) => {
  try {
    // Find company by logged-in user's companyId
    const company =
      await Company.findById(
        req.user.companyId
      );

    // Check company exists
    if (!company) {
      return res.status(404).json({
        success: false,
        message:
          "Company not found",
      });
    }

    // Delete company
    await company.deleteOne();

    res.status(200).json({
      success: true,
      message:
        "Company deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to delete company",
      error: error.message,
    });
  }
};