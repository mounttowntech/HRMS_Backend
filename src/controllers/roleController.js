const RolePermission = require("../models/RolePermission");
const Company = require("../models/Company");
const defaultRolePermissions = [
  {
    roleName: "admin",
    permissions: {
      dashboard: ["read"],
      employees: ["create", "read", "update", "delete"],
      departments: ["create", "read", "update", "delete"],
      attendance: ["create", "read", "update", "delete"],
      leave: ["read", "approve", "reject"],
      payroll: ["create", "read", "update", "publish"],
      projects: ["create", "read", "update", "delete", "assign"],
      tasks: ["create", "read", "update", "delete", "assign", "review"],
      documents: ["create", "read", "verify", "delete"],
      assets: ["create", "read", "update", "assign", "delete"],
      recruitment: ["create", "read", "update", "delete", "hire"],
      onboarding: ["create", "read", "update", "activate"],
      announcements: ["create", "read", "update", "delete"],
      notifications: ["create", "read", "delete"],
      calendar: ["create", "read", "update", "delete"],
      analytics: ["read"],
      reports: ["read"],
      roles: ["create", "read", "update", "delete"],
    },
  },
  {
    roleName: "hr",
    permissions: {
      dashboard: ["read"],
      employees: ["create", "read", "update"],
      departments: ["read"],
      attendance: ["read", "update"],
      leave: ["read", "approve", "reject"],
      payroll: ["read", "generate", "publish"],
      projects: ["read"],
      tasks: ["read"],
      documents: ["create", "read", "verify"],
      assets: ["read", "assign"],
      recruitment: ["create", "read", "update", "hire"],
      onboarding: ["create", "read", "update", "activate"],
      announcements: ["create", "read", "update"],
      notifications: ["create", "read"],
      calendar: ["create", "read"],
      analytics: ["read"],
      reports: ["read"],
      roles: [],
    },
  },
  {
    roleName: "teamlead",
    permissions: {
      dashboard: ["read"],
      employees: ["read"],
      departments: ["read"],
      attendance: ["read"],
      leave: ["read", "approve", "reject"],
      payroll: [],
      projects: ["read"],
      tasks: ["create", "read", "update", "assign", "review"],
      documents: ["read"],
      assets: ["read"],
      recruitment: ["read"],
      onboarding: ["read"],
      announcements: ["read"],
      notifications: ["read"],
      calendar: ["read"],
      analytics: ["read"],
      reports: ["read"],
      roles: [],
    },
  },
  {
    roleName: "employee",
    permissions: {
      dashboard: ["read"],
      employees: [],
      departments: [],
      attendance: ["create", "read"],
      leave: ["create", "read"],
      payroll: ["read", "download"],
      projects: [],
      tasks: ["read", "update"],
      documents: ["create", "read"],
      assets: [],
      recruitment: [],
      onboarding: [],
      announcements: ["read"],
      notifications: ["read"],
      calendar: ["read"],
      analytics: [],
      reports: [],
      roles: [],
    },
  },
];

// CREATE ROLE
exports.createRole = async (req, res) => {
  try {
    const { roleName, permissions } = req.body;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId missing in token",
      });
    }

    if (!roleName) {
      return res.status(400).json({
        success: false,
        message: "roleName is required",
      });
    }

    const existingRole = await RolePermission.findOne({
      companyId,
      roleName,
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role already exists for this company",
      });
    }

    const role = await RolePermission.create({
      companyId,
      roleName,
      permissions: permissions || {},
    });

    const populatedRole = await RolePermission.findById(role._id)
      .populate("companyId", "companyName email");

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      role: populatedRole,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CREATE DEFAULT ROLES
exports.createDefaultRoles = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId missing in token",
      });
    }

    const createdRoles = [];

    for (const item of defaultRolePermissions) {
      const role = await RolePermission.findOneAndUpdate(
        {
          companyId,
          roleName: item.roleName,
        },
        {
          companyId,
          roleName: item.roleName,
          permissions: item.permissions,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      createdRoles.push(role);
    }

    return res.status(201).json({
      success: true,
      message: "Default roles created/updated successfully",
      count: createdRoles.length,
      roles: createdRoles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL ROLES
exports.getRoles = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId missing in token",
      });
    }

    let roles = await RolePermission.find({ companyId });

    if (roles.length === 0) {
      const insertData = defaultRolePermissions.map((role) => ({
        companyId,
        roleName: role.roleName,
        permissions: role.permissions,
      }));

      await RolePermission.insertMany(insertData);

      roles = await RolePermission.find({ companyId }).sort({
        createdAt: 1,
      });
    }

    return res.status(200).json({
      success: true,
      count: roles.length,
      roles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ROLE BY ID
exports.getRoleById = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const role = await RolePermission.findOne({
      _id: req.params.id,
      companyId,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      role,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE ROLE
exports.updateRole = async (req, res) => {
  try {
    const { roleName, permissions } = req.body || {};
    const companyId = req.user?.companyId;

    const roleById = await RolePermission.findById(req.params.id);

    if (!roleById) {
      return res.status(404).json({
        success: false,
        message: "Wrong role id. No role found with this id.",
        roleId: req.params.id,
      });
    }

    if (roleById.companyId.toString() !== companyId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Role companyId and token companyId not matching",
        roleCompanyId: roleById.companyId,
        tokenCompanyId: companyId,
      });
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
        companyId,
      });
    }

    if (roleName) roleById.roleName = roleName;

    if (permissions) {
      roleById.permissions = {
        ...roleById.permissions,
        ...permissions,
      };
    }

    await roleById.save();

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      role: {
        _id: roleById._id,
        roleName: roleById.roleName,
        companyId: company._id,
        companyName: company.companyName,
        companyEmail: company.email,
        permissions: roleById.permissions,
        createdAt: roleById.createdAt,
        updatedAt: roleById.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// DELETE ROLE
exports.deleteRole = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const role = await RolePermission.findOneAndDelete({
      _id: req.params.id,
      companyId,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
      deletedRole: role,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};