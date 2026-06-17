const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
// ✅ Middleware
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));
app.get("/", (req, res) =>
  res.json({ success: true, message: "HRMS Complete Workflow API working" }),
);
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/company", require("./src/routes/companyRoutes"));
app.use("/api/roles", require("./src/routes/roleRoutes"));
app.use("/api/employees", require("./src/routes/employeeRoutes"));
app.use("/api/recruitment", require("./src/routes/recruitmentRoutes"));
app.use("/api/onboarding", require("./src/routes/onboardingRoutes"));
app.use("/api/attendance", require("./src/routes/attendanceRoutes"));
app.use("/api/leaves", require("./src/routes/leaveRoutes"));
app.use("/api/projects", require("./src/routes/projectRoutes"));
app.use("/api/tasks", require("./src/routes/taskRoutes"));
app.use("/api/payroll", require("./src/routes/payrollRoutes"));
app.use("/api/documents", require("./src/routes/documentRoutes"));
app.use("/api/assets", require("./src/routes/assetRoutes"));
app.use("/api/bpo", require("./src/routes/bpoRoutes"));
app.use("/api/reports", require("./src/routes/reportRoutes"));
app.use("/api/dashboard", require("./src/routes/dashboardRoutes"));
app.use("/api/departments", require("./src/routes/departmentRoutes"));
app.use("/api/announcements", require("./src/routes/announcementRoutes")); 
app.use("/api/calendar", require("./src/routes/calendarRoutes"));
app.use("/api/notifications", require("./src/routes/notificationRoutes"));
app.use("/api/designations",require("./src/routes/designationRoutes"));
app.use("/api/shifts", require("./src/routes/shiftRoutes"));
app.use("/api/analytics",require("./src/routes/analyticsRoutes"));
app.use("/api/industry-types", require("./src/routes/industryTypeRoutes"));
app.use("/api/clients",require("./src/routes/clientRoutes"));
app.use("/api/onboarding-documents",require("./src/routes/onboardingDocumentRoutes"));
app.use("/api/holiday",require("./src/routes/holidayRoutes"));
app.use("/api/attendance-requests",require("./src/routes/attendanceRequestRoutes"));
module.exports = app;

