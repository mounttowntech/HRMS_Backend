const OnboardingDocument = require("../models/OnboardingDocument");
const Onboarding = require("../models/Onboarding");
const Employee = require("../models/Employee");

const requiredDocuments = [
  "aadhaar",
  "pan",
  "tenth_marksheet",
  "twelfth_marksheet",
  "experience_letter",
  "three_month_salary_slip",
];

const makeFileData = (file) => {
  if (!file) return undefined;

  return {
    fileName: file.filename,
    fileUrl: `/uploads/onboarding/${file.filename}`,
    mimeType: file.mimetype,
    size: file.size,
    status: "uploaded",
    remarks: "",
  };
};

exports.uploadAllOnboardingDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findOne({
      _id: employeeId,
      companyId: req.user.companyId,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const onboarding = await Onboarding.findOne({
      employeeId,
      companyId: req.user.companyId,
    });

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding not found for this employee",
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one document",
      });
    }

    const updateData = {
      companyId: req.user.companyId,
      candidateId: onboarding.candidateId || null,
      employeeId,
      uploadedBy: req.user.id,
    };

    requiredDocuments.forEach((docName) => {
      if (req.files[docName] && req.files[docName][0]) {
        updateData[docName] = makeFileData(req.files[docName][0]);
      }
    });

    const onboardingDocument = await OnboardingDocument.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        employeeId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    const uploadedAllDocuments = requiredDocuments.every(
      (docName) => onboardingDocument[docName]?.fileUrl
    );

    if (uploadedAllDocuments) {
      onboarding.documentsUploaded = true;
      await onboarding.save();
    }

    res.status(201).json({
      success: true,
      message: "Onboarding documents uploaded successfully",
      uploadedAllDocuments,
      onboardingDocument,
      onboarding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEmployeeOnboardingDocuments = async (req, res) => {
  try {
    const documents = await OnboardingDocument.findOne({
      companyId: req.user.companyId,
      employeeId: req.params.employeeId,
    });

    if (!documents) {
      return res.status(404).json({
        success: false,
        message: "No onboarding documents found",
      });
    }

    res.json({
      success: true,
      documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifySingleOnboardingDocument = async (req, res) => {
  try {
    const { documentName, status, remarks } = req.body;

    if (!requiredDocuments.includes(documentName)) {
      return res.status(400).json({
        success: false,
        message: "Invalid documentName",
      });
    }

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be verified or rejected",
      });
    }

    const document = await OnboardingDocument.findOne({
      companyId: req.user.companyId,
      employeeId: req.params.employeeId,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Onboarding document not found",
      });
    }

    if (!document[documentName] || !document[documentName].fileUrl) {
      return res.status(400).json({
        success: false,
        message: `${documentName} is not uploaded yet`,
      });
    }

    document[documentName].status = status;
    document[documentName].remarks = remarks || "";
    document.verifiedBy = req.user.id;

    await document.save();

    res.json({
      success: true,
      message: `${documentName} ${status} successfully`,
      document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};