const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

dotenv.config();

const app = express();
const employeeRoutes =require("./routes/employee.routes");
const onboardingRoutes =require("./routes/onBoarding.routes");
const leaveRoutes = require("./routes/leave.routes");
const attendanceRoutes =require("./routes/attendance.routes");
const payrollRoutes =require("./routes/payroll.routes");
const taskRoutes = require("./routes/task.routes");
const employerRoutes=require("./routes/employer.routes");
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes 

app.use("/api/employees", employeeRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/employer",employerRoutes);
// Test Route
app.get("/", (req, res) => {
  res.send("Server is working");
});

// DATABASE
const mongoURI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_ATLAS
    : process.env.MONGODB_LOCAL;

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 8000;

    // ✅ FIXED
    app.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err.message);
  });