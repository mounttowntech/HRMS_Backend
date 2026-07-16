const Project = require("../models/Project");
const Company = require("../models/Company");
const Employee = require("../models/Employee");

// Common populate
const populateProject = (query) => {
  return query
    .populate("companyId", "companyName")
    .populate("clientId", "clientName")
    .populate("assignedBy", "fullName designation")
    .populate("projectmanager", "fullName designation")
    .populate("teamlead", "fullName designation")
    .populate("teamMembers", "fullName designation");
};

// CREATE PROJECT
exports.createProject = async (req, res) => {
  try {
   

    const company = await Company.findById(req.user.companyId);

    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Company not found for this token companyId",
        companyId: req.user.companyId,
      });
    }

    const project = await Project.create({
      companyId: company._id,

      clientId: req.body.clientId,
      projectName: req.body.projectName,
      description: req.body.description,

      assignedBy: req.user.employeeId || req.body.assignedBy || null,

      teamlead: req.body.teamlead || null,
      projectmanager: req.body.projectmanager || null,
      teamMembers: req.body.teamMembers || [],

      startDate: req.body.startDate,
      dueDate: req.body.dueDate,
      progress: req.body.progress || 0,
      status: req.body.status || "created",
    });

    const populatedProject = await populateProject(
      Project.findById(project._id)
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: populatedProject,
    });
  } catch (error) {
    console.log("CREATE PROJECT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create project",
    });
  }
};

// GET ALL PROJECTS
exports.getProjects = async (req, res) => {
  try {
    const filter = { companyId: req.user.companyId };
    const userId = req.user.employeeId || req.user.id;
    // find user in employee collection to get role
    const employee = await Employee.findOne({ _id: userId, companyId: req.user.companyId }).select("role");
    if (employee) {
      if (employee.role === "teamlead") {
        filter.teamlead = userId;
      }else if (employee.role === "projectmanager") {
        filter.projectmanager = userId;
      }else if (employee.role === "employee") {
        filter.teamMembers = userId;
      }
    }

    // console.log("Filter for fetching projects:", filter);
    const projects = await populateProject(
      Project.find(filter).sort({ createdAt: -1 })
    );

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

// GET SINGLE PROJECT
exports.getSingleProject = async (req, res) => {
  try {
    const project = await populateProject(
      Project.findOne({
        _id: req.params.id,
        companyId: req.user.companyId,
      })
    );

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

// UPDATE PROJECT
exports.updateProject = async (req, res) => {
  try {
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

    const updatedProject = await populateProject(
      Project.findOneAndUpdate(
        {
          _id: req.params.id,
          companyId: req.user.companyId,
        },
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        }
      )
    );

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

// DELETE PROJECT
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

