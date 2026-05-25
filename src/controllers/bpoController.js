const BpoProcess = require("../models/BpoProcess");

// ==========================================
// START VOICE TRAINING
// ==========================================
exports.startVoiceTraining = async (req, res) => {
  try {
    const process = await BpoProcess.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        employeeId: req.params.employeeId,
      },
      {
        companyId: req.user.companyId,
        employeeId: req.params.employeeId,
        status: "training",
      },
      {
        returnDocument: "after",
        upsert: true,
      }
    ).populate("employeeId", "fullName email designation");

    res.status(200).json({
      success: true,
      message: "Voice training started successfully",
      process,
    });
  } catch (error) {
    console.log("START TRAINING ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to start training",
    });
  }
};

// ==========================================
// ASSIGN PROCESS & SHIFT
// ==========================================
exports.assignProcessAndShift = async (req, res) => {
  try {
    // ✅ Prevent undefined error
    const { processName, shift } = req.body || {};

    if (!processName || !shift) {
      return res.status(400).json({
        success: false,
        message: "Process name and shift are required",
      });
    }

    const process = await BpoProcess.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        employeeId: req.params.employeeId,
      },
      {
        processName,
        shift,
        status: "shift_assigned",
      },
      {
        returnDocument: "after",
        upsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Process and shift assigned successfully",
      process,
    });
  } catch (error) {
    console.log("ASSIGN PROCESS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// MOCK CALL RESULT
// ==========================================
exports.mockCallResult = async (req, res) => {
  try {
    const { passed } = req.body;

    const isPassed = passed === true;

    const process = await BpoProcess.findOneAndUpdate(
      {
        companyId: req.user.companyId,
        employeeId: req.params.employeeId,
      },
      {
        mockCallStatus: isPassed ? "passed" : "failed",
        status: isPassed ? "live_process" : "retraining",
        voiceTrainingCompleted: isPassed,
      },
      {
        returnDocument: "after",
      }
    ).populate("employeeId", "fullName email designation");

    if (!process) {
      return res.status(404).json({
        success: false,
        message: "Employee process not found",
      });
    }

    res.status(200).json({
      success: true,
      message: isPassed
        ? "Employee moved to live process"
        : "Employee moved to retraining",
      process,
    });
  } catch (error) {
    console.log("MOCK CALL ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update mock call result",
    });
  }
};

// ==========================================
// GET ALL BPO PROCESSES
// ==========================================
exports.getBpoProcesses = async (req, res) => {
  try {
    const processes = await BpoProcess.find({
      companyId: req.user.companyId,
    })
      .populate("employeeId", "fullName email designation")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: processes.length,
      processes,
    });
  } catch (error) {
    console.log("GET BPO PROCESS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch processes",
    });
  }
};

// ==========================================
// GET SINGLE EMPLOYEE PROCESS
// ==========================================
exports.getSingleBpoProcess = async (req, res) => {
  try {
    // console.log("PARAM EMPLOYEE ID:", req.params.employeeId);
    // console.log("USER COMPANY ID:", req.user.companyId);

    const process = await BpoProcess.findOne({
      companyId: req.user.companyId,
      employeeId: req.params.employeeId,
    }).populate("employeeId", "fullName email designation");

    // console.log("PROCESS:", process);

    if (!process) {
      return res.status(404).json({
        success: false,
        message: "Process not found",
      });
    }

    res.status(200).json({
      success: true,
      process,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE BPO PROCESS
// ==========================================
exports.deleteBpoProcess = async (req, res) => {
  try {
    const process = await BpoProcess.findOneAndDelete({
      companyId: req.user.companyId,
      employeeId: req.params.employeeId,
    });

    if (!process) {
      return res.status(404).json({
        success: false,
        message: "Process not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "BPO process deleted successfully",
    });
  } catch (error) {
    console.log("DELETE PROCESS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete process",
    });
  }
};