const Onboarding = require("../models/Onboarding");
const Employee = require("../models/Employee");
const User = require("../models/User");
const sendMail = require("../utils/sendMail");
const onboardingStartedTemplate = require("../templates/onboardingStartedTemplate");
const hrVerificationCompletedTemplate = require("../templates/hrVerificationCompletedTemplate");
const accountActivationTemplate =require("../templates/accountActivationTemplate");
exports.startOnboarding = async (req, res) => {
  try {
    // ==========================================
    // FIND EMPLOYEE
    // ==========================================

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

    // ==========================================
    // UPDATE EMPLOYEE STATUS
    // ==========================================

    await Employee.findByIdAndUpdate(
      emp._id,
      {
        $set: {
          status: "onboarding",
        },
      },
      {
        new: true,

        runValidators: false,
      },
    );

    // ==========================================
    // CREATE/UPDATE ONBOARDING
    // ==========================================

    const onboarding = await Onboarding.findOneAndUpdate(
      {
        companyId: req.user.companyId,

        employeeId: emp._id,
      },

      {
        companyId: req.user.companyId,

        employeeId: emp._id,

        status: "started",

        welcomeCompleted: true,
      },

      {
        new: true,
        upsert: true,
      },
    );

    // ==========================================
    // SEND EMAIL
    // ==========================================

    await sendMail({
      to: emp.email,

      subject: "Onboarding Started",

      html: onboardingStartedTemplate(emp.fullName, "Mounttown Technologies"),
    });

    console.log("✅ Onboarding mail sent");

    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({
      success: true,

      message: "Email sent and onboarding started",

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

exports.updateStep = async (req, res) =>
  res.json({
    success: true,
    message: "Onboarding step updated",
    onboarding: await Onboarding.findOneAndUpdate(
      { companyId: req.user.companyId, employeeId: req.params.employeeId },
      req.body,
      { new: true, upsert: true },
    ),
  });
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
      { new: true },
    );

    await sendMail({
      to: emp.email,
      subject: "HR Verification Completed",
      html: hrVerificationCompletedTemplate(
        emp.fullName,
        "Mounttown Technologies",
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

exports.assignAdminAccessAndActivate =
  async (req, res) => {
    try {
      // ==========================================
      // FIND EMPLOYEE
      // ==========================================

      const emp =
        await Employee.findOne({
          _id:
            req.params.employeeId,

          companyId:
            req.user.companyId,
        });

      if (!emp) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      // ==========================================
      // PASSWORD
      // ==========================================

      const password =
        req.body.password ||
        "Welcome@123";

      // ==========================================
      // CHECK USER
      // ==========================================

      let user =
        await User.findOne({
          email: emp.email,
        });

      // ==========================================
      // CREATE USER
      // ==========================================

      if (!user) {
        user =
          await User.create({
            companyId:
              emp.companyId,

            employeeId:
              emp._id,

            name:
              emp.fullName,

            email:
              emp.email,

            phone:
              emp.phone,

            password,

            role:
              emp.role,
          });
      }

      // ==========================================
      // UPDATE EMPLOYEE
      // ==========================================

      await Employee.findByIdAndUpdate(
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

      // ==========================================
      // UPDATE ONBOARDING
      // ==========================================

      const onboarding =
        await Onboarding.findOneAndUpdate(
          {
            companyId:
              req.user.companyId,

            employeeId:
              emp._id,
          },

          {
            adminAccessAssigned:
              true,

            accountSetup: true,

            status:
              "completed",

            completedAt:
              new Date(),
          },

          {
            new: true,
          }
        );

      // ==========================================
      // SEND EMAIL
      // ==========================================

      await sendMail({
        to: emp.email,

        subject:
          "HRMS Account Activated",

        html:
          accountActivationTemplate(
            emp.fullName,
            emp.email,
            password,
            "Mounttown Technologies"
          ),
      });

      console.log(
        "✅ Activation mail sent"
      );

      // ==========================================
      // RESPONSE
      // ==========================================

      res.json({
        success: true,

        message:
          "Admin access assigned and employee active",

        employee: emp,

        onboarding,
      });
    } catch (error) {
      console.log(
        "ACTIVATE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };