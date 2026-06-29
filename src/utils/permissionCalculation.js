const Permission = require("../models/permissionModel");

const MONTHLY_LIMIT = 2;

const calculateHours = (fromTime, toTime) => {
  const [fh, fm] = fromTime.split(":").map(Number);
  const [th, tm] = toTime.split(":").map(Number);

  const fromMinutes = fh * 60 + fm;
  const toMinutes = th * 60 + tm;

  return (toMinutes - fromMinutes) / 60;
};

const getMonthRange = (permissionDate) => {
  const date = new Date(permissionDate);

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  return { start, end };
};

const getMonthlyPermissionHours = async (
  companyId,
  employee,
  permissionDate,
  excludeId = null
) => {
  const { start, end } = getMonthRange(permissionDate);

  const query = {
    companyId,
    employee,
    status: "Active",
    approvalStatus: { $in: ["Pending", "Approved"] },
    permissionDate: { $gte: start, $lte: end },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const permissions = await Permission.find(query);

  return permissions.reduce(
    (total, item) => total + Number(item.totalHours || 0),
    0
  );
};

const validateMonthlyPermission = async (
  companyId,
  employee,
  permissionDate,
  requestedHours,
  excludeId = null
) => {
  const usedHours = await getMonthlyPermissionHours(
    companyId,
    employee,
    permissionDate,
    excludeId
  );

  const remainingHours = MONTHLY_LIMIT - usedHours;

  if (requestedHours > remainingHours) {
    return {
      success: false,
      message: `Monthly permission limit exceeded. Used ${usedHours} hour(s), remaining ${
        remainingHours < 0 ? 0 : remainingHours
      } hour(s).`,
      usedHours,
      remainingHours: remainingHours < 0 ? 0 : remainingHours,
    };
  }

  return {
    success: true,
    usedHours,
    remainingHours,
  };
};

const isDuplicatePermission = async (
  companyId,
  employee,
  permissionDate,
  fromTime,
  toTime,
  excludeId = null
) => {
  const start = new Date(permissionDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(permissionDate);
  end.setHours(23, 59, 59, 999);

  const query = {
    companyId,
    employee,
    status: "Active",
    approvalStatus: { $ne: "Rejected" },
    permissionDate: { $gte: start, $lte: end },
    fromTime,
    toTime,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return await Permission.findOne(query);
};

module.exports = {
  MONTHLY_LIMIT,
  calculateHours,
  getMonthRange,
  getMonthlyPermissionHours,
  validateMonthlyPermission,
  isDuplicatePermission,
};