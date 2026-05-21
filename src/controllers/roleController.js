const RolePermission = require("../models/RolePermission");

// CREATE ROLE
exports.createRole = async (req, res) => {
  try {
    const { roleName, permissions } = req.body;

    if (!roleName) {
      return res.status(400).json({
        success: false,
        message: "roleName is required",
      });
    }

    const existingRole = await RolePermission.findOne({
      companyId: req.user.companyId,
      roleName,
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role already exists",
      });
    }

    const role = await RolePermission.create({
      companyId: req.user.companyId,
      roleName,
      permissions,
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL ROLES
exports.getRoles = async (req, res) => {
  try {
    const roles = await RolePermission.find({
      companyId: req.user.companyId,
    });

    res.status(200).json({
      success: true,
      count: roles.length,
      roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ROLE BY ID
exports.getRoleById = async (req, res) => {
  try {
    const role = await RolePermission.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE ROLE
exports.updateRole = async (req, res) => {
  try {
    const { roleName, permissions } = req.body;

    const role = await RolePermission.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      {
        ...(roleName && { roleName }),
        ...(permissions && { permissions }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE ROLE
exports.deleteRole = async (req, res) => {
  try {
    const role = await RolePermission.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};