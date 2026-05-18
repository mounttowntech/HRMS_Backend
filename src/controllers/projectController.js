const Project = require("../models/Project");
exports.createProject = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      message: "Project created",
      project: await Project.create({
        ...req.body,
        companyId: req.user.companyId,
        assignedBy: req.user.employeeId,
      }),
    });
exports.assignProject = async (req, res) =>
  res.json({
    success: true,
    message: "Project assigned",
    project: await Project.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      {
        projectManager: req.body.projectManager,
        teamMembers: req.body.teamMembers,
        status: "assigned",
      },
      { new: true },
    ),
  });
exports.getProjects = async (req, res) =>
  res.json({
    success: true,
    projects: await Project.find({ companyId: req.user.companyId })
      .populate("projectManager teamMembers", "fullName designation")
      .sort({ createdAt: -1 }),
  });
