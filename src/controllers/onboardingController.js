const Onboarding = require("../models/Onboarding");
const Employee = require("../models/Employee");
const User = require("../models/User");
const Candidate = require("../models/Candidate");

const sendMail = require("../utils/sendMail");
const onboardingStartedTemplate = require("../templates/onboardingStartedTemplate");
const hrVerificationCompletedTemplate = require("../templates/hrVerificationCompletedTemplate");
const accountActivationTemplate = require("../templates/accountActivationTemplate");
const { generateEmployeeIds } = require("../utils/generateEmployee");

exports.startOnboarding = async (req, res) => {
  try {
    const { departmentId, designationId, role, salary } = req.body;

    const candidate = await Candidate.findOne({
      _id: req.params.candidateId,
      companyId: req.user.companyId,
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    if (candidate.status !== "selected" && candidate.status !== "employee_created") {
      return res.status(400).json({
        success: false,
        message: "Only selected or employee created candidates can start onboarding",
      });
    }

    if (!departmentId || !designationId) {
      return res.status(400).json({
        success: false,
        message: "departmentId and designationId are required",
      });
    }

    let employee = await Employee.findOne({
      email: candidate.email,
      companyId: req.user.companyId,
    });

    if (!employee) {
      const { employeeCode, biometricUserId } = await generateEmployeeIds(
        req.user.companyId
      );

      employee = await Employee.create({
        companyId: req.user.companyId,
        employeeCode,
        biometricUserId,

        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,

        departmentId,
        designationId,

        role: role || "employee",
        salary: salary || 0,
        status: "onboarding",
      });
    } else {
      employee.status = "onboarding";
      employee.departmentId = departmentId;
      employee.designationId = designationId;

      if (role) employee.role = role;
      if (salary !== undefined) employee.salary = salary;

      await employee.save();
    }

    candidate.status = "employee_created";
    candidate.employeeId = employee._id;
    await candidate.save();

    const onboarding = await Onboarding.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        candidateId: candidate._id,
      },
      {
        companyId: req.user.companyId,
        candidateId: candidate._id,
        employeeId: employee._id,

        status: "started",

        welcomeCompleted: true,
        personalInfoCompleted: false,
        jobInfoCompleted: false,
        documentsUploaded: false,
        hrVerification: false,
        adminAccessAssigned: false,
        accountSetup: false,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    await sendMail({
      to: employee.email,
      subject: "Onboarding Started",
      html: onboardingStartedTemplate(
        employee.fullName,
        "Mounttown Technologies"
      ),
    });

    res.status(200).json({
      success: true,
      message: "Candidate converted to employee and onboarding started",
      candidate,
      employee,
      onboarding,
    });
  } catch (error) {
    console.log("START ONBOARDING ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getOnboardingList = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      companyId: req.user.companyId,
    };

    if (status) {
      filter.status = status;
    }

    let onboardingQuery = Onboarding.find(filter)
      .populate({
        path: "candidateId",
        select: "fullName email phone status jobPostId",
      })
      .populate({
        path: "employeeId",
        select:
          "employeeCode fullName email phone role salary status departmentId designationId",
        populate: [
          {
            path: "departmentId",
            select: "name",
          },
          {
            path: "designationId",
            select: "name",
          },
        ],
      })
      .sort({ createdAt: -1 });

    const skip = (Number(page) - 1) * Number(limit);

    let onboardingList = await onboardingQuery
      .skip(skip)
      .limit(Number(limit));

    if (search) {
      const searchText = search.toLowerCase();

      onboardingList = onboardingList.filter((item) => {
        const candidateName = item.candidateId?.fullName?.toLowerCase() || "";
        const candidateEmail = item.candidateId?.email?.toLowerCase() || "";
        const employeeName = item.employeeId?.fullName?.toLowerCase() || "";
        const employeeEmail = item.employeeId?.email?.toLowerCase() || "";
        const employeeCode = item.employeeId?.employeeCode?.toLowerCase() || "";

        return (
          candidateName.includes(searchText) ||
          candidateEmail.includes(searchText) ||
          employeeName.includes(searchText) ||
          employeeEmail.includes(searchText) ||
          employeeCode.includes(searchText)
        );
      });
    }

    const total = await Onboarding.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Onboarding list fetched successfully",
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      count: onboardingList.length,
      onboardingList,
    });
  } catch (error) {
    console.log("GET ONBOARDING LIST ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateStep = async (req, res) => {
  try {
    const onboarding = await Onboarding.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        employeeId: req.params.employeeId,
      },
      req.body,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      message: "Onboarding step updated",
      onboarding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.hrVerify = async (req, res) => {
  try {
    const emp = await Employee.findOne({
      _id: req.params.employeeId,
      companyId: req.user.companyId,
    });

    if (!emp) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const onboarding = await Onboarding.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        employeeId: req.params.employeeId,
      },
      {
        hrVerification: true,
        status: "admin_access",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    await sendMail({
      to: emp.email,
      subject: "HR Verification Completed",
      html: hrVerificationCompletedTemplate(
        emp.fullName,
        "Mounttown Technologies"
      ),
    });

    res.json({
      success: true,
      message: "HR verification completed and email sent",
      onboarding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.assignAdminAccessAndActivate = async (req, res) => {
  try {
    const emp = await Employee.findOne({
      _id: req.params.employeeId,
      companyId: req.user.companyId,
    });

    if (!emp) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const password = req.body.password || "Welcome@123";

    let user = await User.findOne({
      email: emp.email,
    });

    if (!user) {
      user = await User.create({
        companyId: emp.companyId,
        employeeId: emp._id,
        name: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        password,
        role: emp.role,
      });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      emp._id,
      {
        $set: {
          userId: user._id,
          status: "active",
        },
      },
      {
        new: true,
        runValidators: false,
      }
    );

    const onboarding = await Onboarding.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        employeeId: emp._id,
      },
      {
        adminAccessAssigned: true,
        accountSetup: true,
        status: "completed",
        completedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    await sendMail({
      to: emp.email,
      subject: "HRMS Account Activated",
      html: accountActivationTemplate(
        emp.fullName,
        emp.email,
        password,
        "Mounttown Technologies"
      ),
    });

    res.json({
      success: true,
      message: "Admin access assigned and employee active",
      employee: updatedEmployee,
      onboarding,
    });
  } catch (error) {
    console.log("ACTIVATE ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};