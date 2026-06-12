const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const formatAmount = (amount) => {
  return Number(amount || 0).toLocaleString("en-IN");
};

const generatePayslip = async ({ employee, payrollData, monthName, year }) => {
  const folderPath = path.join(__dirname, "../uploads/payslips");

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const fileName = `${employee.employeeCode}-${monthName}-${year}-payslip.pdf`;
  const filePath = path.join(folderPath, fileName);

  const doc = new PDFDocument({
    size: "A4",
    margin: 30,
  });

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(16).font("Helvetica-Bold").text(
    "Mounttown Technology Private Limited",
    { align: "center" }
  );

  doc.fontSize(9).font("Helvetica").text(
    "4A, 3rd Street, Co-operative colony, Mettupalayam 641301.",
    { align: "center" }
  );

  doc.text("www.themounttown.com | hr@themounttown.com", {
    align: "center",
  });

  doc.text("+919363969381 | +919500980047", {
    align: "center",
  });

  doc.text("GST - 33AAQCM8928E1Z4", {
    align: "center",
  });

  doc.moveDown(0.5);

  doc.fontSize(14).font("Helvetica-Bold").text("Pay Slip", {
    align: "center",
    underline: true,
  });

  doc.moveDown();

  const startX = 35;
  let y = doc.y;
  const rowHeight = 22;

  const drawInfoRow = (leftLabel, leftValue, rightLabel, rightValue) => {
    doc.fontSize(9).font("Helvetica");

    doc.text(leftLabel, startX, y);
    doc.text(":", startX + 120, y);
    doc.text(leftValue || "", startX + 130, y);

    doc.text(rightLabel, startX + 300, y);
    doc.text(":", startX + 420, y);
    doc.text(rightValue || "", startX + 430, y);

    y += rowHeight;
  };

  drawInfoRow(
    "Date of Joining",
    employee.joiningDate
      ? new Date(employee.joiningDate).toLocaleDateString("en-IN")
      : "",
    "Employee name",
    employee.fullName
  );

  drawInfoRow(
    "Pay Period",
    `${monthName}-${year}`,
    "Designation",
    payrollData.designation
  );

  drawInfoRow(
    "Worked Days",
    String(payrollData.presentDays),
    "Shift",
    payrollData.shiftName
  );

  y += 8;

  const tableX = 35;
  const c1 = 170;
  const c2 = 155;
  const c3 = 155;
  const c4 = 45;

  const drawCell = (x, y, w, h, text, bold = false, align = "left") => {
    doc.rect(x, y, w, h).stroke();
    doc.fontSize(9).font(bold ? "Helvetica-Bold" : "Helvetica");
    doc.text(text || "", x + 5, y + 7, {
      width: w - 10,
      align,
    });
  };

  drawCell(tableX, y, c1, rowHeight, "Earnings", true);
  drawCell(tableX + c1, y, c2, rowHeight, "Amount", true);
  drawCell(tableX + c1 + c2, y, c3, rowHeight, "Deductions", true);
  drawCell(tableX + c1 + c2 + c3, y, c4, rowHeight, "Amount", true);

  y += rowHeight;

  const rows = [
    ["Basic Salary", payrollData.basicSalary, "PF & ESI", payrollData.totalDeduction],
    ["House Rent Allowance (HRA)", payrollData.hra, "", ""],
    [
      payrollData.shiftName?.toLowerCase().includes("night")
        ? "Night Shift Allowance"
        : "Day Shift Allowance",
      payrollData.shiftAllowance,
      "",
      "",
    ],
    ["Medical Allowance", payrollData.medicalAllowance, "", ""],
    ["Conveyance Allowance", payrollData.conveyanceAllowance, "", ""],
    ["Other Allowance", payrollData.otherAllowance, "", ""],
  ];

  rows.forEach((row) => {
    drawCell(tableX, y, c1, rowHeight, row[0]);
    drawCell(tableX + c1, y, c2, rowHeight, formatAmount(row[1]), false, "right");
    drawCell(tableX + c1 + c2, y, c3, rowHeight, row[2]);
    drawCell(
      tableX + c1 + c2 + c3,
      y,
      c4,
      rowHeight,
      row[3] ? formatAmount(row[3]) : "",
      false,
      "right"
    );
    y += rowHeight;
  });

  drawCell(tableX, y, c1, rowHeight, "Total Earnings", true);
  drawCell(tableX + c1, y, c2, rowHeight, formatAmount(payrollData.grossEarning), true, "right");
  drawCell(tableX + c1 + c2, y, c3, rowHeight, "Total Deductions", true);
  drawCell(tableX + c1 + c2 + c3, y, c4, rowHeight, formatAmount(payrollData.totalDeduction), true, "right");

  y += rowHeight;

  drawCell(tableX, y, c1 + c2, rowHeight, "");
  drawCell(tableX + c1 + c2, y, c3, rowHeight, "Net Pay", true);
  drawCell(tableX + c1 + c2 + c3, y, c4, rowHeight, formatAmount(payrollData.netSalary), true, "right");

  doc.end();

  return `/uploads/payslips/${fileName}`;
};

module.exports = generatePayslip;