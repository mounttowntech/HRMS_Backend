const Employer = require("../model/employerModel");

const generateEmployerCode = async () => {
  const count = await Employer.countDocuments();

  return `EMPLOYER${String(count + 1).padStart(4, "0")}`;
};

// CREATE EMPLOYER
exports.createEmployer = async (req, res) => {
  try {
    const {
      companyName,
      ownerName,
      email,
      phone,
      industryType,
      companySize,
      address,
      subscriptionPlan,
    } = req.body;

    const existingEmployer = await Employer.findOne({
      email: email.toLowerCase(),
    });

    if (existingEmployer) {
      return res.status(400).json({
        success: false,
        message: "Employer email already exists",
      });
    }

    const employerCode = await generateEmployerCode();

    const employer = await Employer.create({
      companyName,
      employerCode,
      ownerName,
      email,
      phone,
      industryType,
      companySize,
      address,
      subscriptionPlan,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Employer created successfully",
      employer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL EMPLOYERS
exports.getAllEmployers = async (req, res) => {
  try {
    const employers = await Employer.find()
      .populate("createdBy", "userName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      employers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE EMPLOYER
exports.getEmployerById = async (req, res) => {
  try {
    const { employerId } = req.params;

    const employer = await Employer.findById(employerId).populate(
      "createdBy",
      "userName email role"
    );

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    res.status(200).json({
      success: true,
      employer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE EMPLOYER
exports.updateEmployer = async (req, res) => {
  try {
    const { employerId } = req.params;

    const employer = await Employer.findByIdAndUpdate(
      employerId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employer updated successfully",
      employer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE EMPLOYER
exports.deleteEmployer = async (req, res) => {
  try {
    const { employerId } = req.params;

    const employer = await Employer.findByIdAndDelete(employerId);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CHANGE EMPLOYER STATUS
exports.changeEmployerStatus = async (req, res) => {
  try {
    const { employerId } = req.params;
    const { status } = req.body;

    const employer = await Employer.findByIdAndUpdate(
      employerId,
      { status },
      { new: true }
    );

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employer status updated successfully",
      employer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};