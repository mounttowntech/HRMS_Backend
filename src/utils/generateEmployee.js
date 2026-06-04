const Employee = require("../models/Employee");

const generateEmployeeIds = async (companyId) => {
  let nextNumber = 1;
  let employeeCode;
  let biometricUserId;
  let exists = true;

  const lastEmployee = await Employee.findOne({ companyId })
    .sort({ createdAt: -1 })
    .select("employeeCode");

  if (lastEmployee?.employeeCode) {
    const lastNumber = parseInt(
      lastEmployee.employeeCode.replace("EMP", ""),
      10
    );

    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  while (exists) {
    const padded = String(nextNumber).padStart(4, "0");

    employeeCode = `EMP${padded}`;
    biometricUserId = `BIO${padded}`;

    exists = await Employee.findOne({
      companyId,
      $or: [{ employeeCode }, { biometricUserId }],
    });

    if (exists) nextNumber++;
  }

  return {
    employeeCode,
    biometricUserId,
  };
};

module.exports = {
  generateEmployeeIds,
};