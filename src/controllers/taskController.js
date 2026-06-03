const Task = require("../models/Task");
const Employee = require("../models/Employee");
const allowedStatus = [
  "assigned",
  "started",
  "in_progress",
  "completed",
  "under_review",
  "rework",
  "closed",
];
const allowedPriority = ["low", "medium", "high"];

// Create Task
exports.createTask = async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      assignedBy,
      assignedTo,
      priority,
      status,
      dueDate,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project id is required",
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Task name is required",
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Assigned employee is required",
      });
    }

    const task = await Task.create({
      companyId: req.user.companyId,
      projectId,
      title,
      description,
      assignedTo,
      assignedBy: assignedBy || req.user.employeeId || null,
      priority: priority || "medium",
      status: status || "assigned",
      dueDate: dueDate || null,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Tasks
exports.getTasks = async (req, res) => {
  try {
    const filter = {
      companyId: req.user.companyId,
    };

    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter)
      .populate("projectId", "projectName")
      .populate("assignedTo", "fullName role designation")
      .populate("assignedBy", "fullName role designation")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Task
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    })
      .populate("projectId", "projectName")
      .populate("assignedTo", "fullName role designation")
      .populate("assignedBy", "fullName role designation");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      priority,
      status,
      dueDate,
      updateText,
      submitReview,
      approved,
      remarks,
    } = req.body;

    if (priority && !allowedPriority.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority value",
      });
    }

    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    if (status !== undefined) {
      task.status = status;
    }
    let loggedEmployeeId = req.user.employeeId || null;

    if (!loggedEmployeeId) {
      const employee = await Employee.findOne({
        userId: req.user.id,
        companyId: req.user.companyId,
      });

      if (employee) {
        loggedEmployeeId = employee._id;
      }
    }

    const task = await Task.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    if (status !== undefined) {
      task.status = status;
    }

    if (updateText !== undefined && updateText.trim() !== "") {
      task.dailyUpdates.push({
        updateText,
        addedBy: loggedEmployeeId,
      });

      task.status = "in_progress";
    }

    if (submitReview === true) {
      task.status = "under_review";
      task.review.status = "pending";
    }

    if (approved !== undefined) {
      task.review = {
        reviewedBy: loggedEmployeeId,
        status: approved === true ? "approved" : "rework",
        remarks: remarks || "",
      };

      task.status = approved === true ? "closed" : "rework";
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("projectId", "projectName")
      .populate("assignedTo", "fullName role designation")
      .populate("assignedBy", "fullName role designation")
      .populate("dailyUpdates.addedBy", "fullName role designation")
      .populate("review.reviewedBy", "fullName role designation");

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Quick Status Update
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: req.user.companyId,
      },
      { status },
      { new: true, runValidators: true },
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.find({
      companyId: req.user.companyId,
      projectId,
    })
      .populate("projectId", "projectName")
      .populate("assignedTo", "fullName role designation")
      .populate("assignedBy", "fullName role designation")
      .populate("dailyUpdates.addedBy", "fullName role designation")
      .populate("review.reviewedBy", "fullName role designation")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};