const mongoose = require("mongoose");
const Permission = require("../models/permissionModel");
const Employee = require("../models/Employee");
const Project = require("../models/Project");
const attendanceModel = require("../models/Attendance");
const calculateAttendanceStatus = require("../utils/attendanceCalculator").calculateAttendanceStatus;

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

// exports.getAllPermissions = async (req, res) => {
//   try {
//     const companyId = req.user.companyId;
//     const userId = req.user.id || req.user.userId;

//     console.log("Fetching permissions for companyId:", companyId, "userId:", userId);

//     const {
//       employee,
//       approvalStatus,
//       status,
//       month,
//       year,
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const query = { companyId };

// console.log("employee_querty:", employee);

//     //find employee by userId
//     const employeeData = await Employee.findOne({
//       userId,
//       companyId,
//     }).select("_id fullName employeeCode role departmentId designationId shiftId");

//     console.log("Employee data found:", employeeData);
//  if(employeeData?.role == "projectmanager") {
//       //find employees in the same department as the project manager
//       const employeesInDepartment = await Project.find({
//         projectmanager: employeeData?._id,
//         companyId,
//       }).select("_id teamMembers");
//       console.log("Employees in project manager's projects:", employeesInDepartment);
//       //find permissions for project manager's team members
//      const teamMemberIds = [ ...new Set(
//     employeesInDepartment.flatMap((project) =>
//       project.teamMembers.map((id) => id.toString())
//     )
//   ),
// ];
//       console.log("Team member IDs:", teamMemberIds);
//       query.employee = { $in: teamMemberIds };
//     } else if(employeeData?.role == "teamlead") {
//       const teamLeadDepartment = employeeData?.departmentId;
//       //find employees in the same department as the team lead
//       const employeesInDepartment = await Employee.find({
//         departmentId: teamLeadDepartment,
//         companyId,
//       }).select("_id");
//       const employeeIds = employeesInDepartment.map((emp) => emp._id);
//       query.employee = { $in: employeeIds };
//     }
// console.log("Query after role-based filtering:", query);
//     if (employee) query.employee = employee;
//     if (approvalStatus) query.approvalStatus = approvalStatus;
//     if (status) query.status = status;
//     if (month) query.month = Number(month);
//     if (year) query.year = Number(year);

//     const skip = (Number(page) - 1) * Number(limit);

//     const [permissions, totalRecords] = await Promise.all([
//       Permission.find(query)
//         .populate("employee", "employeeCode fullName email")
//         .populate("approvedBy", "name email role")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit)),

//       Permission.countDocuments(query),
//     ]);

//     return res.status(200).json({
//       success: true,
//       totalRecords,
//       totalPages: Math.ceil(totalRecords / Number(limit)),
//       currentPage: Number(page),
//       data: permissions,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.getAllPermissions = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.userId;

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

    const employeeData = await Employee.findOne({
      userId,
      companyId,
    }).select("_id fullName employeeCode role departmentId");

    // if (!employeeData) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Employee not found",
    //   });
    // }

    let allowedEmployeeIds = null;

    if (employeeData?.role === "projectmanager") {
      const projects = await Project.find({
        projectmanager: employeeData._id,
        companyId,
      }).select("teamMembers");

      allowedEmployeeIds = [
        ...new Set(
          projects.flatMap((project) =>
            project.teamMembers.map((id) => id.toString())
          )
        ),
      ];

      query.employee = { $in: allowedEmployeeIds };
    }

    if (employeeData?.role === "teamlead") {
      const employeesInDepartment = await Employee.find({
        departmentId: employeeData.departmentId,
        companyId,
      }).select("_id");

      allowedEmployeeIds = employeesInDepartment.map((emp) =>
        emp._id.toString()
      );

      query.employee = { $in: allowedEmployeeIds };
    }

    if (employee) {
      if (
        allowedEmployeeIds &&
        !allowedEmployeeIds.includes(employee.toString())
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied for this employee permission",
        });
      }

      query.employee = employee;
    }

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

// convert minutes from fromTime and toTime to hours and minutes, then calculate the difference in hours.
const calculatePermissionTotalMinutes = (fromTime, toTime) => {
  const [fromHours, fromMinutes] = fromTime.split(":").map(Number);
  const [toHours, toMinutes] = toTime.split(":").map(Number);

  const fromTotalMinutes = fromHours * 60 + fromMinutes;
  const toTotalMinutes = toHours * 60 + toMinutes;

  const differenceInMinutes = toTotalMinutes - fromTotalMinutes;
  const differenceInHours = differenceInMinutes / 60;

  return differenceInHours;
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
      approvalStatus
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

  //   if( approvalStatus && ["Pending", "Approved", "Rejected"].includes(approvalStatus)) {

  //     if (approvalStatus == "Approved") {
        
  //       let totalPermissionMinutes = permission.totalHours * 60;
  //       console.log("Total Permission Minutes:", totalPermissionMinutes);
  //       const attendanceDate = permission.permissionDate
  //         .toISOString()
  //         .split("T")[0];
  //       let attendanceRecord = await attendanceModel.findOne({
  //         companyId,
  //         employeeId: permission.employee,
  //         attendanceDate,
  //       });
  //       console.log("Attendance Record Found:", attendanceRecord);
  //       if (attendanceRecord) {
  //         attendance.effectiveMinutes =
  // (attendance.workingMinutes || 0) +
  // (attendance.permissionMinutes ?? totalPermissionMinutes || 0);
  //         attendanceRecord.permissionMinutes = totalPermissionMinutes;
  //         attendanceRecord.permissionApproved = true;
  //         attendanceRecord = await calculateAttendanceStatus(attendanceRecord);

  //         await attendanceRecord.save();
  //       }
  //     }

  //     permission.approvalStatus = approvalStatus;
  //     permission.approvedBy = req.user.id || req.user.userId;
  //   }

  //   await permission.save();

    if (approvalStatus && ["Pending", "Approved", "Rejected"].includes(approvalStatus) ) {
      // Update permission first
      permission.approvalStatus = approvalStatus;
      permission.approvedBy = req.user.id || req.user.userId;

      await permission.save();

      // Update attendance only when approved
      if (approvalStatus === "Approved") {
        const totalPermissionMinutes = permission.totalHours * 60;

        const attendanceDate = permission.permissionDate
          .toISOString()
          .split("T")[0];

        let attendanceRecord = await attendanceModel.findOne({
          companyId,
          employeeId: permission.employee,
          attendanceDate,
        });

        // console.log("Attendance Record Found:", attendanceRecord);

        // Attendance exists (Past / Current Date)
        if (attendanceRecord) {
          attendanceRecord.permissionMinutes = totalPermissionMinutes;
          attendanceRecord.permissionApproved = true;

          // Calculate effective minutes
          attendanceRecord.effectiveMinutes =
            (attendanceRecord.workingMinutes || 0) +
            (attendanceRecord.permissionMinutes || 0);

          // Recalculate attendance status/session/payable day
          attendanceRecord = await calculateAttendanceStatus(
            attendanceRecord
          );

          await attendanceRecord.save();
        }
        // Future date: attendance not created yet
        // No action required here.
      }
    }

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
exports.getMyPermissions = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.userId;

    // Find logged-in employee
    const employee = await Employee.findOne({
      userId,
      companyId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const {
      month,
      year,
      approvalStatus,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      companyId,
      employee: employee._id,
    };

    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [permissions, totalRecords] = await Promise.all([
      Permission.find(query)
        .populate({
          path: "employee",
          select:
            "employeeCode fullName email departmentId designationId shiftId role status",
          populate: [
            {
              path: "departmentId",
              select: "name",
            },
            {
              path: "designationId",
              select: "name",
            },
            {
              path: "shiftId",
              select: "shiftName",
            },
          ],
        })
        .populate("approvedBy", "name email role")
        .sort({ permissionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      Permission.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      totalRecords,
      totalPages: Math.ceil(totalRecords / Number(limit)),
      currentPage: Number(page),
      permissions,
    });
  } catch (error) {
    console.log("GET MY PERMISSIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};