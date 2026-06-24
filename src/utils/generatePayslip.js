const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const formatAmount = (amount) => {
  return Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const generatePayslip = async ({ employee, payrollData, monthName, year }) => {
  return new Promise((resolve, reject) => {
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

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Mounttown Technology Private Limited", { align: "center" });

    doc
      .fontSize(9)
      .font("Helvetica")
      .text("4A, 3rd Street, Co-operative colony, Mettupalayam 641301.", {
        align: "center",
      });

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
    let y = doc.y + 5;
    const rowHeight = 22;

    const drawInfoRow = (leftLabel, leftValue, rightLabel, rightValue) => {
      doc.fontSize(9).font("Helvetica");

      doc.text(leftLabel, startX, y, { width: 110 });
      doc.text(":", startX + 120, y);
      doc.text(String(leftValue || ""), startX + 135, y, { width: 190 });

      doc.text(rightLabel, startX + 330, y, { width: 110 });
      doc.text(":", startX + 455, y);
      doc.text(String(rightValue || ""), startX + 470, y, { width: 100 });

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

    y += 10;

    const tableX = 35;
    const c1 = 170;
    const c2 = 120;
    const c3 = 160;
    const c4 = 110;
    const tableWidth = c1 + c2 + c3 + c4;

    const drawCell = (x, y, w, h, text, bold = false, align = "left") => {
      doc.rect(x, y, w, h).stroke();

      doc.fontSize(8.8).font(bold ? "Helvetica-Bold" : "Helvetica");

      doc.text(String(text || ""), x + 5, y + 7, {
        width: w - 10,
        align,
        lineBreak: false,
      });
    };

    const drawHeaderCell = (x, y, w, h, text) => {
      doc.rect(x, y, w, h).fillAndStroke("#d9d9d9", "#000000");
      doc.fillColor("#000000");
      doc.fontSize(9).font("Helvetica-Bold");

      doc.text(text, x + 5, y + 7, {
        width: w - 10,
        align: "left",
        lineBreak: false,
      });
    };

    drawHeaderCell(tableX, y, c1, rowHeight, "Earnings");
    drawHeaderCell(tableX + c1, y, c2, rowHeight, "Amount");
    drawHeaderCell(tableX + c1 + c2, y, c3, rowHeight, "Deductions");
    drawHeaderCell(tableX + c1 + c2 + c3, y, c4, rowHeight, "Amount");

    y += rowHeight;

    const shiftLabel = payrollData.shiftName?.toLowerCase().includes("night")
      ? "Night Shift Allowance"
      : "Day Shift Allowance";

    const rows = [
      [
        "Basic Salary",
        formatAmount(payrollData.basicSalary),
        "PF & ESI",
        formatAmount(payrollData.totalDeduction),
      ],
      ["House Rent Allowance (HRA)", formatAmount(payrollData.hra), "", ""],
      [shiftLabel, formatAmount(payrollData.shiftAllowance), "", ""],
      ["Medical Allowance", formatAmount(payrollData.medicalAllowance), "", ""],
      [
        "Conveyance Allowance",
        formatAmount(payrollData.conveyanceAllowance),
        "",
        "",
      ],
      ["Other Allowance", formatAmount(payrollData.otherAllowance), "", ""],
    ];

    rows.forEach((row) => {
      drawCell(tableX, y, c1, rowHeight, row[0]);
      drawCell(tableX + c1, y, c2, rowHeight, row[1], false, "right");
      drawCell(tableX + c1 + c2, y, c3, rowHeight, row[2]);
      drawCell(
        tableX + c1 + c2 + c3,
        y,
        c4,
        rowHeight,
        row[3],
        false,
        "right"
      );

      y += rowHeight;
    });

    drawCell(tableX, y, c1, rowHeight, "Total Earnings", true);
    drawCell(
      tableX + c1,
      y,
      c2,
      rowHeight,
      formatAmount(payrollData.grossEarning),
      true,
      "right"
    );

    drawCell(tableX + c1 + c2, y, c3, rowHeight, "Total Deductions", true);
    drawCell(
      tableX + c1 + c2 + c3,
      y,
      c4,
      rowHeight,
      formatAmount(payrollData.totalDeduction),
      true,
      "right"
    );

    y += rowHeight;

    drawCell(tableX, y, c1 + c2, rowHeight, "");
    drawCell(tableX + c1 + c2, y, c3, rowHeight, "Net Pay", true);
    drawCell(
      tableX + c1 + c2 + c3,
      y,
      c4,
      rowHeight,
      formatAmount(payrollData.netSalary),
      true,
      "right"
    );

    y += rowHeight + 10;

    doc
      .fontSize(8)
      .font("Helvetica")
      .text("This is a system generated payslip.", tableX, y, {
        width: tableWidth,
        align: "center",
      });

    doc.end();

    stream.on("finish", () => {
      resolve(`/uploads/payslips/${fileName}`);
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
};

module.exports = generatePayslip;