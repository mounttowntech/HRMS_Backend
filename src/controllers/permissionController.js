const mongoose = require("mongoose");
const Permission = require("../models/permissionModel");
const Employee = require("../models/Employee");

const {
  MONTHLY_LIMIT,
  calculateHours,
  validateMonthlyPermission,
  isDuplicatePermission,
} = require("../utils/permissionCalculation");

exports.createPermission = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const {
      employee,
      permissionDate,
      fromTime,
      toTime,
      reason,
      department,
      designation,
    } = req.body;

    if (!employee || !permissionDate || !fromTime || !toTime || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const employeeData = await Employee.findOne({
      _id: employee,
      companyId,
    });

    if (!employeeData) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const totalHours = calculateHours(fromTime, toTime);

    if (![1, 2].includes(totalHours)) {
      return res.status(400).json({
        success: false,
        message: "Permission should be exactly 1 hour or 2 hours",
      });
    }

    const duplicate = await isDuplicatePermission(
      companyId,
      employee,
      permissionDate,
      fromTime,
      toTime
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Permission already applied",
      });
    }

    const validation = await validateMonthlyPermission(
      companyId,
      employee,
      permissionDate,
      totalHours
    );

    if (!validation.success) {
      return res.status(400).json(validation);
    }

    const permission = await Permission.create({
      companyId,
      employee,
      department,
      designation,
      permissionDate,
      fromTime,
      toTime,
      totalHours,
      permissionType: totalHours === 1 ? "1 Hour" : "2 Hours",
      reason,
      monthlyHoursUsed: validation.usedHours + totalHours,
      remainingMonthlyHours: validation.remainingHours - totalHours,
      approvalStatus: "Pending",
      createdBy: req.user.id || req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Permission applied successfully",
      data: permission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.approvePermission = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const { remarks } = req.body;

    const permission = await Permission.findOne({
      _id: id,
      companyId,
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    if (permission.approvalStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Permission already ${permission.approvalStatus}`,
      });
    }

    const validation = await validateMonthlyPermission(
      companyId,
      permission.employee,
      permission.permissionDate,
      permission.totalHours,
      permission._id
    );

    if (!validation.success) {
      return res.status(400).json(validation);
    }

    permission.approvalStatus = "Approved";
    permission.managerRemarks = remarks || "";
    permission.approvedBy = req.user.id || req.user.userId;
    permission.approvedDate = new Date();
    permission.monthlyHoursUsed = validation.usedHours + permission.totalHours;
    permission.remainingMonthlyHours =
      validation.remainingHours - permission.totalHours;

    await permission.save();

    return res.status(200).json({
      success: true,
      message: "Permission approved successfully",
      data: permission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.rejectPermission = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const { remarks } = req.body;

    const permission = await Permission.findOne({
      _id: id,
      companyId,
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    if (permission.approvalStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Permission already ${permission.approvalStatus}`,
      });
    }

    permission.approvalStatus = "Rejected";
    permission.managerRemarks = remarks || "";
    permission.approvedBy = req.user.id || req.user.userId;
    permission.approvedDate = new Date();

    await permission.save();

    return res.status(200).json({
      success: true,
      message: "Permission rejected successfully",
      data: permission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllPermissions = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const {
      employee,
      approvalStatus,
      status,
      month,
      year,
      page = 1,
      limit = 10,
    } = req.query;

    const query = { companyId };

    if (employee) query.employee = employee;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (status) query.status = status;
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    const skip = (Number(page) - 1) * Number(limit);

    const [permissions, totalRecords] = await Promise.all([
      Permission.find(query)
        .populate("employee", "employeeCode fullName email")
        .populate("approvedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      Permission.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      totalRecords,
      totalPages: Math.ceil(totalRecords / Number(limit)),
      currentPage: Number(page),
      data: permissions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    })
      .populate("employee", "employeeCode fullName email")
      .populate("approvedBy", "name email role");

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: permission,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEmployeeMonthlySummary = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { employeeId, month, year } = req.query;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "employeeId is required",
      });
    }

    const selectedMonth = Number(month) || new Date().getMonth() + 1;
    const selectedYear = Number(year) || new Date().getFullYear();

    const permissions = await Permission.find({
      companyId,
      employee: employeeId,
      month: selectedMonth,
      year: selectedYear,
      status: "Active",
    });

    const approvedHours = permissions
      .filter((item) => item.approvalStatus === "Approved")
      .reduce((sum, item) => sum + item.totalHours, 0);

    const pendingHours = permissions
      .filter((item) => item.approvalStatus === "Pending")
      .reduce((sum, item) => sum + item.totalHours, 0);

    return res.status(200).json({
      success: true,
      summary: {
        month: selectedMonth,
        year: selectedYear,
        monthlyLimit: MONTHLY_LIMIT,
        approvedHours,
        pendingHours,
        usedHours: approvedHours + pendingHours,
        remainingHours: Math.max(
          0,
          MONTHLY_LIMIT - approvedHours - pendingHours
        ),
      },
      permissions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updatePermission = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const permissionId = req.params.id;

    const {
      permissionDate,
      fromTime,
      toTime,
      reason,
      department,
      designation,
    } = req.body;

    const permission = await Permission.findOne({
      _id: permissionId,
      companyId,
      status: "Active",
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    if (permission.approvalStatus === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Approved permission cannot be updated",
      });
    }

    const totalHours = calculateHours(fromTime, toTime);

    if (![1, 2].includes(totalHours)) {
      return res.status(400).json({
        success: false,
        message: "Permission should be exactly 1 or 2 hours",
      });
    }

    const duplicate = await isDuplicatePermission(
      companyId,
      permission.employee,
      permissionDate,
      fromTime,
      toTime,
      permissionId
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Permission already exists for the same time",
      });
    }

    const validation = await validateMonthlyPermission(
      companyId,
      permission.employee,
      permissionDate,
      totalHours,
      permissionId
    );

    if (!validation.success) {
      return res.status(400).json(validation);
    }

    permission.permissionDate = permissionDate;
    permission.fromTime = fromTime;
    permission.toTime = toTime;
    permission.totalHours = totalHours;
    permission.permissionType =
      totalHours === 1 ? "1 Hour" : "2 Hours";
    permission.reason = reason;
    permission.department = department;
    permission.designation = designation;

    permission.monthlyHoursUsed =
      validation.usedHours + totalHours;

    permission.remainingMonthlyHours =
      validation.remainingHours - totalHours;

    permission.updatedBy = req.user.id || req.user.userId;

    await permission.save();

    return res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      data: permission,
    });
  } catch (error) {
    console.log("UPDATE PERMISSION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deletePermission = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const permissionId = req.params.id;

    const permission = await Permission.findOne({
      _id: permissionId,
      companyId,
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    if (permission.approvalStatus === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Approved permission cannot be deleted",
      });
    }

    permission.status = "Cancelled";
    permission.updatedBy = req.user.id || req.user.userId;

    await permission.save();

    return res.status(200).json({
      success: true,
      message: "Permission cancelled successfully",
    });
  } catch (error) {
    console.log("DELETE PERMISSION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};