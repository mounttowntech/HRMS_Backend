const Employee = require("../models/Employee");
const Onboarding = require("../models/Onboarding");

exports.updateOnboardingStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, remarks } = req.body;

    const onboarding = await Onboarding.findOne({ employeeId });

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding record not found",
      });
    }

    onboarding.status = status;
    onboarding.remarks = remarks || onboarding.remarks;

    if (status === "HR Verified") {
      onboarding.hrVerifiedBy = req.user.id;
    }

    if (status === "Admin Access Assigned") {
      onboarding.adminAccessAssignedBy = req.user.id;
    }

    if (status === "Employee Active") {
      await Employee.findByIdAndUpdate(employeeId, {
        employeeStatus: "Active",
      });
    }

    await onboarding.save();

    res.status(200).json({
      success: true,
      message: "Onboarding status updated",
      onboarding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.uploadDocuments = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      userId: req.user.id,
    });

    const onboarding = await Onboarding.findOne({
      employeeId: employee._id,
    });

    onboarding.documents = {
      ...onboarding.documents,
      ...req.body.documents,
    };

    onboarding.status = "Documents Uploaded";

    await onboarding.save();

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      onboarding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.assignSystemAccess = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { systemAccess } = req.body;

    const onboarding = await Onboarding.findOne({ employeeId });

    onboarding.systemAccess = {
      ...onboarding.systemAccess,
      ...systemAccess,
    };

    onboarding.status = "Admin Access Assigned";
    onboarding.adminAccessAssignedBy = req.user.id;

    await onboarding.save();

    res.status(200).json({
      success: true,
      message: "System access assigned successfully",
      onboarding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getOnboardingByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const onboarding = await Onboarding.findOne({
      employeeId,
    }).populate("employeeId");

    res.status(200).json({
      success: true,
      onboarding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};