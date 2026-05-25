const Designation = require("../models/designationModel");

// CREATE DESIGNATION
exports.createDesignation = async (req, res) => {
  try {
    const designation = await Designation.create({
      name: req.body.name,
      departmentId: req.body.departmentId || null,
    });

    res.status(201).json({
      success: true,
      message: "Designation created successfully",
      designation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL DESIGNATIONS
exports.getDesignations = async (req, res) => {
  try {
    const designations = await Designation.find()
      .populate("departmentId", "name");

    res.json({
      success: true,
      designations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET DESIGNATIONS BY DEPARTMENT ID
exports.getDesignationsByDepartment = async (req, res) => {
  try {
    const designations = await Designation.find({
      departmentId: req.params.departmentId,
    }).populate("departmentId", "name");

    res.json({
      success: true,
      designations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE DESIGNATION
exports.updateDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        departmentId: req.body.departmentId || null,
      },
      { new: true }
    );

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    res.json({
      success: true,
      message: "Designation updated successfully",
      designation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE DESIGNATION
exports.deleteDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndDelete(req.params.id);

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    res.json({
      success: true,
      message: "Designation deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};