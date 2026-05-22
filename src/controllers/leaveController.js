const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const { calculateDays } = require("../utils/calcDays");
const sendEmail = require("../utils/sendMail");
const leaveApprovalTemplate = require("../templates/leaveApprovalTemplate");
// ======================================================
// APPLY LEAVE
// ======================================================

exports.applyLeave = async (req, res) => {
  try {
    const employeeId =
      req.user.employeeId || req.body.employeeId;

    // ======================================================
    // VALIDATE EMPLOYEE
    // ======================================================

    const emp = await Employee.findOne({
      _id: employeeId,
      companyId: req.user.companyId,
    });

    if (!emp) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // ======================================================
    // REQUEST DATA
    // ======================================================

    const {
      leaveType,
      fromDate,
      toDate,
      reason,
    } = req.body;

    // ======================================================
    // VALIDATION
    // ======================================================

    if (
      !leaveType ||
      !fromDate ||
      !toDate ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message:
          "leaveType, fromDate, toDate and reason are required",
      });
    }

    // ======================================================
    // CALCULATE LEAVE DAYS
    // ======================================================

    const days = calculateDays(
      fromDate,
      toDate
    );

    // ======================================================
    // CHECK LEAVE BALANCE
    // ======================================================

    const balance =
      emp.leaveBalance?.[leaveType] || 0;

    console.log("LEAVE TYPE:", leaveType);
    console.log("AVAILABLE:", balance);
    console.log("REQUESTED:", days);

    // ======================================================
    // INSUFFICIENT BALANCE
    // ======================================================

    if (balance < days) {
      const leave = await Leave.create({
        companyId: req.user.companyId,
        employeeId,
        leaveType,
        fromDate,
        toDate,
        reason,
        days,
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
        message:
          "Insufficient leave balance",
        availableBalance: balance,
        requestedDays: days,
        leave,
      });
    }

    // ======================================================
    // CREATE LEAVE
    // ======================================================

    const leave = await Leave.create({
      companyId: req.user.companyId,
      employeeId,
      leaveType,
      fromDate,
      toDate,
      reason,
      days,
      balanceAvailable: true,
      status: "pending_manager",

      managerApproval: {
        status: "pending",
      },

      hrApproval: {
        status: "pending",
      },
    });

    res.status(201).json({
      success: true,
      message:
        "Leave applied and sent for manager approval",
      leave,
    });
  } catch (error) {
    console.log(
      "APPLY LEAVE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// MANAGER APPROVAL
// ======================================================

exports.managerApproval = async (
  req,
  res
) => {
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

    const approved =
      req.body.approved === true;

    // ======================================================
    // MANAGER APPROVAL DATA
    // ======================================================

    leave.managerApproval = {
      approvedBy: req.user.employeeId,
      status: approved
        ? "approved"
        : "rejected",
      remarks:
        req.body.remarks || "",
    };

    // ======================================================
    // UPDATE STATUS
    // ======================================================

    leave.status = approved
      ? "pending_hr"
      : "manager_rejected";

    await leave.save();

    res.json({
      success: true,
      message: approved
        ? "Manager approved. Sent to HR"
        : "Manager rejected leave",
      leave,
    });
  } catch (error) {
    console.log(
      "MANAGER APPROVAL ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// HR APPROVAL
// ======================================================

exports.hrApproval = async (
  req,
  res
) => {
  try {
    // ======================================================
    // FIND LEAVE
    // ======================================================

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

    // ======================================================
    // APPROVAL STATUS
    // ======================================================

    const approved =
      req.body.approved === true;

    // ======================================================
    // UPDATE HR APPROVAL
    // ======================================================

    leave.hrApproval = {
      approvedBy: req.user.employeeId,

      status: approved
        ? "approved"
        : "rejected",

      remarks:
        req.body.remarks || "",
    };

    // ======================================================
    // UPDATE LEAVE STATUS
    // ======================================================

    leave.status = approved
      ? "approved"
      : "rejected";

    // ======================================================
    // FIND EMPLOYEE
    // ======================================================

    const emp =
      await Employee.findById(
        leave.employeeId
      );

    if (!emp) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found",
      });
    }

    // ======================================================
    // IF LEAVE APPROVED
    // ======================================================

    if (approved) {
      // ==================================================
      // CURRENT LEAVE BALANCE
      // ==================================================

      const currentBalance =
        emp.leaveBalance?.[
          leave.leaveType
        ] || 0;

      // ==================================================
      // UPDATED BALANCE
      // ==================================================

      const updatedBalance =
        Math.max(
          0,
          currentBalance -
            leave.days
        );

      // ==================================================
      // UPDATE LEAVE BALANCE
      // ==================================================

      await Employee.findByIdAndUpdate(
        leave.employeeId,
        {
          $set: {
            [`leaveBalance.${leave.leaveType}`]:
              updatedBalance,
          },
        },
        {
          new: true,
          runValidators: false,
        }
      );

      // ==================================================
      // UPDATE ATTENDANCE
      // ==================================================

      for (
        let d = new Date(
          leave.fromDate
        );
        d <= new Date(leave.toDate);
        d.setDate(d.getDate() + 1)
      ) {
        const day = new Date(d);

        day.setHours(
          0,
          0,
          0,
          0
        );

        await Attendance.findOneAndUpdate(
          {
            companyId:
              req.user.companyId,

            employeeId:
              leave.employeeId,

            date: day,
          },

          {
            companyId:
              req.user.companyId,

            employeeId:
              leave.employeeId,

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

    // ======================================================
    // SAVE LEAVE
    // ======================================================

    await leave.save();

    // ======================================================
    // EMAIL TEMPLATE
    // ======================================================

    const html =
      leaveApprovalTemplate(
        emp.fullName,
        leave.leaveType,
        new Date(
          leave.fromDate
        ).toDateString(),
        new Date(
          leave.toDate
        ).toDateString(),
        approved
          ? "Approved"
          : "Rejected",
        "HRMS"
      );

    // ======================================================
    // SEND EMAIL
    // ======================================================

    await sendEmail({
      to: emp.email,

      subject: `Leave ${
        approved
          ? "Approved"
          : "Rejected"
      }`,

      html,
    });

    console.log(
      "✅ Leave Email Sent"
    );

    // ======================================================
    // RESPONSE
    // ======================================================

    res.json({
      success: true,

      message: approved
        ? "Leave approved and attendance updated"
        : "Leave rejected by HR",

      leave,
    });
  } catch (error) {
    console.log(
      "HR APPROVAL ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ======================================================
// GET ALL LEAVES
// ======================================================

exports.getLeaves = async (
  req,
  res
) => {
  try {
    const leaves = await Leave.find({
      companyId:
        req.user.companyId,
    })
      .populate(
        "employeeId",
        `
        fullName
        employeeCode
        department
        designation
      `
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    console.log(
      "GET LEAVES ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};