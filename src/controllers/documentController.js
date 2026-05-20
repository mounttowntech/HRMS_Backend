const Document = require("../models/Document");

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Document file is required",
      });
    }

    const document = await Document.create({
      companyId: req.user.companyId,
      employeeId: req.user.employeeId || req.body.employeeId,
      documentType: req.body.documentType,

      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyDocument = async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      {
        status: req.body.status || "verified",
        verifiedBy: req.user.employeeId,
        remarks: req.body.remarks,
      },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      message: "Document verification updated",
      document,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
    };

    if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }

    const documents = await Document.find(filter)
      .populate("employeeId", "fullName email")
      .populate("verifiedBy", "fullName email")
      .sort({ createdAt: -1 });

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