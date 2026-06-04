const JobPost = require("../models/JobPost");
const Candidate = require("../models/Candidate");
const Employee = require("../models/Employee");
const Department = require("../models/departmentModel");
const Designation = require("../models/designationModel");
const sendMail = require("../utils/sendMail");
const offerLetterTemplate = require("../templates/offerLetterTemplate");
exports.createJobPost = async (req, res) =>
  res.status(201).json({
    success: true,
    message: "Job post created",
    job: await JobPost.create({
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user.id,
    }),
  });
exports.applyCandidate = async (req, res) =>
  res.status(201).json({
    success: true,
    message: "Candidate applied",
    candidate: await Candidate.create({
      ...req.body,
      companyId: req.user.companyId,
      status: "applied",
    }),
  });

exports.resumeScreening = async (req, res) => {
  try {
    const { selected } = req.body;

    if (typeof selected !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "selected must be true or false",
      });
    }

    const status = selected ? "hr_interview" : "screening_rejected";

    const candidate = await Candidate.findOneAndUpdate(
      {
        _id: req.params.candidateId,
        companyId: req.user.companyId,
      },
      { status },
      { new: true },
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      message: selected
        ? "Candidate moved to HR interview"
        : "Candidate rejected in resume screening",
      candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.hrInterview = async (req, res) => {
  const passed = req.body.passed;
  res.json({
    success: true,
    message: passed ? "Moved to technical round" : "Candidate rejected",
    candidate: await Candidate.findOneAndUpdate(
      { _id: req.params.candidateId, companyId: req.user.companyId },
      {
        status: passed ? "technical_round" : "screening_rejected",
        hrInterview: {
          status: passed ? "passed" : "failed",
          remarks: req.body.remarks,
        },
      },
      { new: true },
    ),
  });
};
exports.technicalRound = async (req, res) => {
  try {
    const passed = req.body.passed;

    const candidate = await Candidate.findOneAndUpdate(
      {
        _id: req.params.candidateId,
        companyId: req.user.companyId,
      },
      {
        status: passed ? "selected" : "technical_rejected",
        technicalRound: {
          status: passed ? "passed" : "failed",
          remarks: req.body.remarks,
        },
      },
      { new: true },
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    if (passed) {
      await sendMail({
        to: candidate.email,
        subject: "Offer Letter",
        html: offerLetterTemplate(
          candidate.fullName,
          req.body.designation,
          req.body.joiningDate,
          "Mounttown Technologies",
        ),
      });
    }

    res.json({
      success: true,
      message: passed
        ? "Candidate selected and offer letter sent"
        : "Candidate rejected",
      candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.createEmployeeFromCandidate =
  async (req, res) => {
    try {
      // ==========================================
      // FIND CANDIDATE
      // ==========================================

      const c =
        await Candidate.findOne({
          _id: req.params.candidateId,
          companyId:
            req.user.companyId,
        });

      if (!c) {
        return res.status(404).json({
          success: false,
          message:
            "Candidate not found",
        });
      }

      // ==========================================
      // CHECK STATUS
      // ==========================================

      if (
        c.status !== "selected"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Candidate not selected",
        });
      }

      // ==========================================
      // VALIDATION
      // ==========================================

      const {
        departmentId,
        designationId,
        role,
        salary,
      } = req.body;

      if (
        !departmentId ||
        !designationId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "departmentId and designationId are required",
        });
      }

      // ==========================================
      // CHECK DEPARTMENT
      // ==========================================

      const department =
        await Department.findById(
          departmentId
        );

      if (!department) {
        return res.status(404).json({
          success: false,
          message:
            "Department not found",
        });
      }

      // ==========================================
      // CHECK DESIGNATION
      // ==========================================

      const designation =
        await Designation.findById(
          designationId
        );

      if (!designation) {
        return res.status(404).json({
          success: false,
          message:
            "Designation not found",
        });
      }

      // ==========================================
      // EMPLOYEE COUNT
      // ==========================================

      const count =
        await Employee.countDocuments(
          {
            companyId:
              req.user.companyId,
          }
        );

      // ==========================================
      // CREATE EMPLOYEE
      // ==========================================

      const emp =
        await Employee.create({
          companyId:
            req.user.companyId,

          employeeCode: `EMP${String(
            count + 1
          ).padStart(4, "0")}`,

          fullName: c.fullName,

          email: c.email,

          phone: c.phone,

          departmentId,

          designationId,

          role:
            role || "employee",

          salary: salary || 0,

          status: "pending",
        });

      // ==========================================
      // UPDATE CANDIDATE
      // ==========================================

      c.status =
        "employee_created";

      await c.save();

      // ==========================================
      // RESPONSE
      // ==========================================

      res.status(201).json({
        success: true,

        message:
          "Employee created from candidate",

        employee: emp,
      });
    } catch (error) {
      console.log(
        "CREATE EMPLOYEE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  exports.getAllJobPosts = async (req, res) => {
  try {
    const jobs = await JobPost.find({
      companyId: req.user.companyId,
    })
      .populate("createdBy", "userName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Job posts fetched successfully",
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getJobPostById = async (req, res) => {
  try {
    const job = await JobPost.findOne({
      _id: req.params.jobPostId,
      companyId: req.user.companyId,
    }).populate("createdBy", "userName email role");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job post fetched successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateJobPostById = async (req, res) => {
  try {
    const job = await JobPost.findOneAndUpdate(
      {
        _id: req.params.jobPostId,
        companyId: req.user.companyId,
      },
      {
        ...req.body,
        companyId: req.user.companyId,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job post updated successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteJobPostById = async (req, res) => {
  try {
    const job = await JobPost.findOneAndDelete({
      _id: req.params.jobPostId,
      companyId: req.user.companyId,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job post not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job post deleted successfully",
      deletedJob: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};