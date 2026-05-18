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
