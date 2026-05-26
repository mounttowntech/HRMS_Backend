const Project = require("../models/Project");

// ======================================
// CREATE PROJECT
// ======================================
exports.createProject = async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,

      // ✅ From logged in user
      companyId: req.user.companyId,

      // ✅ Employee/Admin who created project
      assignedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.log("CREATE PROJECT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create project",
    });
  }
};

// ======================================
// ASSIGN PROJECT
// ======================================
exports.assignProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      {
        projectManager: req.body.projectManager,
        teamMembers: req.body.teamMembers,
        status: "assigned",
      },
      {
        new: true,
      }
    )
      .populate("assignedBy", "fullName designation")
      .populate("teamlead", "fullName designation")
      .populate("projectmanager","fullName designation")
      .populate("teamMembers", "fullName designation");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Project assigned successfully",
      project,
    });
  } catch (error) {
    console.log("ASSIGN PROJECT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to assign project",
    });
  }
};

// ======================================
// GET ALL PROJECTS
// ======================================
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      companyId: req.user.companyId,
    })
      .populate("assignedBy", "fullName designation")
      .populate("projectmanager", "fullName designation")
      .populate("teamlead", "fullName designation")
      .populate("teamMembers", "fullName designation")
      .populate("clientId", "clientName") // 👈 add this
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.log("GET PROJECTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch projects",
    });
  }
};

// ======================================
// GET SINGLE PROJECT
// ======================================
exports.getSingleProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    })
      .populate("assignedBy", "fullName designation")
      .populate("projectmanager","fullName designation")
      .populate("teamlead", "fullName designation")
      .populate("teamMembers", "fullName designation");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    console.log("GET SINGLE PROJECT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch project",
    });
  }
};

// ======================================
// UPDATE PROJECT
// ======================================
exports.updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const companyId = req.user.companyId;

    const allowedFields = [
      "clientId",
      "projectName",
      "description",
      "assignedBy",
      "teamlead",
      "projectmanager",
      "teamMembers",
      "startDate",
      "dueDate",
      "progress",
      "status",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (
        req.body[field] !== undefined &&
        req.body[field] !== null &&
        req.body[field] !== ""
      ) {
        updateData[field] = req.body[field];
      }
    });

    const updatedProject = await Project.findOneAndUpdate(
      {
        _id: projectId,
        companyId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("clientId", "clientName")
      .populate("assignedBy", "fullName designation")
      .populate("projectmanager", "fullName designation")
      .populate("teamlead", "fullName designation")
      .populate("teamMembers", "fullName designation");

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.log("UPDATE PROJECT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update project",
    });
  }
};

// ======================================
// DELETE PROJECT
// ======================================
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.log("DELETE PROJECT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete project",
    });
  }
};