const Department = require("../models/departmentModel");
const Employee = require("../models/Employee");

exports.createDepartment = async (req, res) => {
  try {
    const department = await Department.create({
      companyId: req.user.companyId,
      name: req.body.name,
      head: req.body.head || null,
      description: req.body.description,
      status: req.body.status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({
      companyId: req.user.companyId,
    })
      .populate("head", "fullName email employeeCode designation");

    res.json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    }).populate("head", "fullName email employeeCode designation");

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const employees = await Employee.find({
      companyId: req.user.companyId,
      department: department.name,
    }).select("fullName email employeeCode designation role status");

    res.json({
      success: true,
      department,
      employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      {
        name: req.body.name,
        head: req.body.head || null,
        description: req.body.description,
        status: req.body.status,
      },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.json({
      success: true,
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};