const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Announcement = require("../models/announcementsModel");

const { calculateDays } = require("../utils/calcDays");
const sendEmail = require("../utils/sendMail");
const leaveApprovalTemplate = require("../templates/leaveApprovalTemplate");
const Notification = require("../models/notificationModel");
const User = require("../models/User");

// CREATE HR ANNOUNCEMENT NOTIFICATION
const createHRNotification = async ({
  companyId,
  title,
  description,
  createdBy,
}) => {
  try {
    await Announcement.create({
      companyId,
      title,
      description,
      targetRoles: ["hr"],
      priority: "high",
      status: "active",
      createdBy,
    });
  } catch (error) {
    console.log("HR NOTIFICATION ERROR:", error.message);
  }
};

// APPLY LEAVE
exports.applyLeave = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. userId not found",
      });
    }

    const emp = await Employee.findOne({
      userId,
      companyId: req.user.companyId,
    });

    if (!emp) {
      return res.status(404).json({
        success: false,
        message: "Employee not found for this logged-in user",
      });
    }

    const { leaveType, fromDate, toDate, reason, documentType } = req.body;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "leaveType, fromDate, toDate and reason are required",
      });
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({
        success: false,
        message: "fromDate cannot be greater than toDate",
      });
    }

    const days = calculateDays(fromDate, toDate);
    const balance = emp.leaveBalance?.[leaveType] || 0;

    const documents =
      req.files?.map((file) => ({
        documentType: documentType || "other",
        fileName: file.filename,
        fileUrl: `/uploads/leaves/${file.filename}`,
        mimeType: file.mimetype,
      })) || [];
console.log("balance leave is :", {
  balance,
  days,
});
    if (balance < days) {
      const leave = await Leave.create({
        companyId: req.user.companyId,
        employeeId: emp._id,
        leaveType,
        fromDate,
        toDate,
        reason,
        days,
        documents,
        balanceAvailable: false,
        status: "balance_rejected",
        managerApproval: {
          status: "pending",
        },
        hrApproval: {
          status: "pending",
        },
      });

      return res.status(200).json({
        success: false,
        message: "Insufficient leave balance",
        availableBalance: balance,
        requestedDays: days,
        leave,
      });
    }

    const leave = await Leave.create({
      companyId: req.user.companyId,
      employeeId: emp._id,
      leaveType,
      fromDate,
      toDate,
      reason,
      days,
      documents,
      balanceAvailable: true,
      status: "pending_manager",
      managerApproval: {
        status: "pending",
      },
      hrApproval: {
        status: "pending",
      },
    });

    await createHRNotification({
      companyId: req.user.companyId,
      title: "New Leave Request",
      description: `${emp.fullName} applied for ${leaveType} leave from ${fromDate} to ${toDate}.`,
      createdBy: req.user.id || req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    console.log("APPLY LEAVE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// MANAGER APPROVAL
exports.managerApproval = async (req, res) => {
  try {
    const leave = await Leave.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    const approved = req.body.approved === true;

    leave.managerApproval = {
      approvedBy: req.user.employeeId,
      status: approved ? "approved" : "rejected",
      remarks: req.body.remarks || "",
    };

    leave.status = approved ? "pending_hr" : "manager_rejected";

    await leave.save();

    if (approved) {
      const emp = await Employee.findById(leave.employeeId);

      await createHRNotification({
        companyId: req.user.companyId,
        title: "Leave Waiting for HR Approval",
        description: `${
          emp?.fullName || "Employee"
        } leave request is approved by manager and waiting for HR approval.`,
        createdBy: req.user.id || req.user.userId,
      });
    }

    res.status(200).json({
      success: true,
      message: approved
        ? "Manager approved. Sent to HR"
        : "Manager rejected leave",
      leave,
    });
  } catch (error) {
    console.log("MANAGER APPROVAL ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// HR APPROVAL
exports.hrApproval = async (req, res) => {
  try {
    const leave = await Leave.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    const approved = req.body.approved === true;

    const loggedEmployee = await Employee.findOne({
      userId: req.user?.userId || req.user?.id,
      companyId: req.user.companyId,
    });

    leave.hrApproval = {
      approvedBy: loggedEmployee?._id || req.user.employeeId || null,
      status: approved ? "approved" : "rejected",
      remarks: req.body.remarks || "",
    };

    leave.status = approved ? "approved" : "rejected";

    const emp = await Employee.findById(leave.employeeId);

    if (!emp) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (approved) {
      const currentBalance = emp.leaveBalance?.[leave.leaveType] || 0;
      const updatedBalance = Math.max(0, currentBalance - leave.days);

      await Employee.findByIdAndUpdate(
        leave.employeeId,
        {
          $set: {
            [`leaveBalance.${leave.leaveType}`]: updatedBalance,
          },
        },
        {
          new: true,
          runValidators: false,
        }
      );

      for (
        let d = new Date(leave.fromDate);
        d <= new Date(leave.toDate);
        d.setDate(d.getDate() + 1)
      ) {
        const day = new Date(d);
        day.setHours(0, 0, 0, 0);

        await Attendance.findOneAndUpdate(
          {
            companyId: req.user.companyId,
            employeeId: leave.employeeId,
            date: day,
          },
          {
            companyId: req.user.companyId,
            employeeId: leave.employeeId,
            date: day,
            status: "leave",
          },
          {
            upsert: true,
            new: true,
          }
        );
      }
    }

    await leave.save();

    const html = leaveApprovalTemplate(
      emp.fullName,
      leave.leaveType,
      new Date(leave.fromDate).toDateString(),
      new Date(leave.toDate).toDateString(),
      approved ? "Approved" : "Rejected",
      "HRMS"
    );

    await sendEmail({
      to: emp.email,
      subject: `Leave ${approved ? "Approved" : "Rejected"}`,
      html,
    });

    res.status(200).json({
      success: true,
      message: approved
        ? "Leave approved and attendance updated"
        : "Leave rejected by HR",
      leave,
    });
  } catch (error) {
    console.log("HR APPROVAL ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET LEAVES ROLE BASED
exports.getLeaves = async (req, res) => {
  try {
    const loggedInUserId = req.user?.userId || req.user?.id;
    const role = req.user.role;

    let filter = {
      companyId: req.user.companyId,
    };

    if (role === "employee") {
      const emp = await Employee.findOne({
        userId: loggedInUserId,
        companyId: req.user.companyId,
      });

      if (!emp) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      filter.employeeId = emp._id;
    }

    if (role === "teamlead") {
      const teamLead = await Employee.findOne({
        userId: loggedInUserId,
        companyId: req.user.companyId,
      });

      if (!teamLead) {
        return res.status(404).json({
          success: false,
          message: "Team lead not found",
        });
      }

      const teamEmployees = await Employee.find({
        companyId: req.user.companyId,
        reportingManager: teamLead._id,
      }).select("_id");

      filter.employeeId = {
        $in: teamEmployees.map((emp) => emp._id),
      };
    }

    if (role === "projectmanager" || role === "manager") {
      const manager = await Employee.findOne({
        userId: loggedInUserId,
        companyId: req.user.companyId,
      });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Manager not found",
        });
      }

      const teamEmployees = await Employee.find({
        companyId: req.user.companyId,
        projectManager: manager._id,
      }).select("_id");

      filter.employeeId = {
        $in: teamEmployees.map((emp) => emp._id),
      };
    }

    const leaves = await Leave.find(filter)
      .populate(
        "employeeId",
        "fullName employeeCode email departmentId designationId"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      role,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    console.log("GET LEAVES ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET MY LEAVES
exports.getMyLeaves = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    const emp = await Employee.findOne({
      userId,
      companyId: req.user.companyId,
    });

    if (!emp) {
      return res.status(404).json({
        success: false,
        message: "Employee not found for this logged-in user",
      });
    }

    const leaves = await Leave.find({
      companyId: req.user.companyId,
      employeeId: emp._id,
    })
      .populate(
        "employeeId",
        "fullName employeeCode email departmentId designationId"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    console.log("GET MY LEAVES ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE LEAVE
exports.updateLeave = async (req, res) => {
  try {
    const loggedInUserId = req.user?.userId || req.user?.id;
    const role = req.user.role;

    const leave = await Leave.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    const loggedEmployee = await Employee.findOne({
      userId: loggedInUserId,
      companyId: req.user.companyId,
    });

    if (!loggedEmployee && !["admin", "hr"].includes(role)) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const {
      leaveType,
      fromDate,
      toDate,
      reason,
      documentType,
      status,
      remarks,
    } = req.body;

    if (status) {
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be approved or rejected",
        });
      }

      if (role === "employee") {
        return res.status(403).json({
          success: false,
          message: "Employee cannot approve or reject leave",
        });
      }

      if (role === "teamlead" || role === "projectmanager") {
        const teamEmployee = await Employee.findOne({
          _id: leave.employeeId,
          companyId: req.user.companyId,
          $or: [
            { reportingManager: loggedEmployee._id },
            { projectManager: loggedEmployee._id },
          ],
        });

        if (!teamEmployee) {
          return res.status(403).json({
            success: false,
            message: "You can approve only your team member leave",
          });
        }

        leave.managerApproval = {
          status,
          approvedBy: loggedEmployee._id,
          remarks: remarks || "",
        };

        leave.status = status === "approved" ? "pending_hr" : "manager_rejected";

        if (status === "approved") {
          const emp = await Employee.findById(leave.employeeId);

          await createHRNotification({
            companyId: req.user.companyId,
            title: "Leave Waiting for HR Approval",
            description: `${
              emp?.fullName || "Employee"
            } leave request is approved by manager and waiting for HR approval.`,
            createdBy: req.user.id || req.user.userId,
          });
        }
      }

      if (role === "hr" || role === "admin") {
        leave.hrApproval = {
          status,
          approvedBy: loggedEmployee?._id || null,
          remarks: remarks || "",
        };

        leave.status = status === "approved" ? "approved" : "rejected";
      }

      await leave.save();

      return res.status(200).json({
        success: true,
        message: "Leave status updated successfully",
        leave,
      });
    }

    if (role === "employee") {
      if (leave.employeeId.toString() !== loggedEmployee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can update only your own leave",
        });
      }
    }

    if (role === "teamlead" || role === "projectmanager") {
      const teamEmployee = await Employee.findOne({
        _id: leave.employeeId,
        companyId: req.user.companyId,
        $or: [
          { reportingManager: loggedEmployee._id },
          { projectManager: loggedEmployee._id },
        ],
      });

      if (!teamEmployee) {
        return res.status(403).json({
          success: false,
          message: "You can update only your team member leave",
        });
      }
    }

    const finalFromDate = fromDate || leave.fromDate;
    const finalToDate = toDate || leave.toDate;

    if (new Date(finalFromDate) > new Date(finalToDate)) {
      return res.status(400).json({
        success: false,
        message: "fromDate cannot be greater than toDate",
      });
    }

    if (leaveType) leave.leaveType = leaveType;
    if (fromDate) leave.fromDate = fromDate;
    if (toDate) leave.toDate = toDate;
    if (reason) leave.reason = reason;

    if (fromDate || toDate) {
      leave.days = calculateDays(finalFromDate, finalToDate);
    }

    if (req.files && req.files.length > 0) {
      const newDocuments = req.files.map((file) => ({
        documentType: documentType || "other",
        fileName: file.filename,
        fileUrl: `/uploads/leaves/${file.filename}`,
        mimeType: file.mimetype,
      }));

      leave.documents.push(...newDocuments);
    }

    leave.managerApproval = {
      status: "pending",
    };

    leave.hrApproval = {
      status: "pending",
    };

    leave.status = "pending_manager";

    await leave.save();

    res.status(200).json({
      success: true,
      message: "Leave updated successfully",
      leave,
    });
  } catch (error) {
    console.log("UPDATE LEAVE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE LEAVE
exports.deleteLeave = async (req, res) => {
  try {
    const loggedInUserId = req.user?.userId || req.user?.id;
    const role = req.user.role;

    const leave = await Leave.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Approved leave cannot be deleted",
      });
    }

    const loggedEmployee = await Employee.findOne({
      userId: loggedInUserId,
      companyId: req.user.companyId,
    });

    if (!loggedEmployee && !["admin", "hr"].includes(role)) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (role === "employee") {
      if (leave.employeeId.toString() !== loggedEmployee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can delete only your own leave",
        });
      }
    }

    if (role === "teamlead" || role === "projectmanager") {
      const teamEmployee = await Employee.findOne({
        _id: leave.employeeId,
        companyId: req.user.companyId,
        $or: [
          { reportingManager: loggedEmployee._id },
          { projectManager: loggedEmployee._id },
        ],
      });

      if (!teamEmployee) {
        return res.status(403).json({
          success: false,
          message: "You can delete only your team member leave",
        });
      }
    }

    await Leave.findByIdAndDelete(leave._id);

    res.status(200).json({
      success: true,
      message: "Leave deleted successfully",
    });
  } catch (error) {
    console.log("DELETE LEAVE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};