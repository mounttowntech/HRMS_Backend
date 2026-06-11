const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const generatePayslip = async ({ employee, payrollData, month, year }) => {
  const folderPath = path.join(__dirname, "../uploads/payslips");

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const fileName = `${employee.employeeCode}-${month}-${year}-payslip.pdf`;
  const filePath = path.join(folderPath, fileName);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("Payslip", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Employee Name: ${employee.fullName}`);
  doc.text(`Employee Code: ${employee.employeeCode}`);
  doc.text(`Role: ${employee.role}`);
  doc.text(`Month/Year: ${month}/${year}`);
  doc.moveDown();

  doc.text(`Total Working Days: ${payrollData.totalWorkingDays}`);
  doc.text(`Present Days: ${payrollData.presentDays}`);
  doc.text(`Absent Days: ${payrollData.absentDays}`);
  doc.moveDown();

  doc.text(`Basic Salary: ₹${payrollData.basicSalary}`);
  doc.text(`Per Day Salary: ₹${payrollData.perDaySalary}`);
  doc.text(`Gross Earning: ₹${payrollData.grossEarning}`);
  doc.moveDown();

  doc.text(`PF Deduction: ₹${payrollData.pfDeduction}`);
  doc.text(`ESI Deduction: ₹${payrollData.esiDeduction}`);
  doc.text(`Total Deduction: ₹${payrollData.totalDeduction}`);
  doc.moveDown();

  doc.fontSize(14).text(`Net Salary: ₹${payrollData.netSalary}`, {
    align: "right",
  });

  doc.end();

  return `/uploads/payslips/${fileName}`;
};

module.exports = generatePayslip;