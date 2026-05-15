const Task = require("../models/Task");

exports.createTask = async (req, res) => {
  try {
    const {
      taskName,
      description,
      assignedTo,
      projectName,
      dueDate,
      priority,
    } = req.body;

    const task = await Task.create({
      taskName,
      description,
      assignedTo,
      assignedBy: req.user.id,
      projectName,
      dueDate,
      priority,
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

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, remarks } = req.body;

    const task = await Task.findById(taskId);

    task.status = status;
    task.remarks = remarks || task.remarks;

    if (status === "Completed") {
      task.completedAt = new Date();
    }

    await task.save();

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

exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user.id,
    })
      .populate("assignedBy", "userName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "userName email role")
      .populate("assignedBy", "userName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};