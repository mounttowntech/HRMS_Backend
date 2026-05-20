const RolePermission = require("../models/RolePermission");
exports.createOrUpdateRole = async (req, res) => {
  const { roleName, permissions } = req.body;
  const role = await RolePermission.findOneAndUpdate(
    { companyId: req.user.companyId, roleName },
    { companyId: req.user.companyId, roleName, permissions },
    { new: true, upsert: true },
  );
  res.json({ success: true, message: "Role permissions saved", role });
};
exports.getRoles = async (req, res) =>
  res.json({
    success: true,
    roles: await RolePermission.find({ companyId: req.user.companyId }),
  });

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

    res.json({
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
