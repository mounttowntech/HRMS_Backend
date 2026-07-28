const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { toWords } = require("number-to-words");

//==================================================
// FORMAT CURRENCY
//==================================================

const formatAmount = (amount = 0) => {
  return Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

//==================================================
// FORMAT DATE
// DD/MM/YYYY
//==================================================

const formatDate = (date) => {
  if (!date) return "";

  const d = new Date(date);

  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

//==================================================
// NUMBER TO WORDS
//==================================================

const amountInWords = (amount) => {
  amount = Math.round(Number(amount || 0));

  return (
    "Rupees " +
    toWords(amount)
      .replace(/\b\w/g, (c) => c.toUpperCase()) +
    " Only"
  );
};

//==================================================
// GENERATE PAYSLIP
//==================================================

const generatePayslip = async ({
  employee,
  payrollData,
  monthName,
  year,
}) => {
  return new Promise((resolve, reject) => {    //==========================================
    // CREATE FOLDER
    //==========================================

    const folderPath = path.join(
      process.cwd(),
      "uploads",
      "payslips"
    );

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, {
        recursive: true,
      });
    }

    //==========================================
    // FILE NAME
    //==========================================

    const today = new Date();

    const fileName =
      employee.fullName.replace(/\s+/g, "_") +
      "_" +
      String(today.getDate()).padStart(2, "0") +
      "_" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "_" +
      today.getFullYear() +
      ".pdf";

    const filePath = path.join(folderPath, fileName);

    //==========================================
    // PDF
    //==========================================

    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
    });

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
        //==========================================
    // COMPANY HEADER
    //==========================================

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("Mounttown Technology Private Limited", {
        align: "center",
      });

    doc.moveDown(0.2);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        "4A, 3rd Street, Co-operative Colony, Mettupalayam - 641301",
        {
          align: "center",
        }
      );

    doc.text("www.themounttown.com", {
      align: "center",
    });

    doc.text("hr@themounttown.com", {
      align: "center",
    });

    doc.text("+91 9363969381", {
      align: "center",
    });

    doc.moveDown();

    doc
      .font("Helvetica-Bold")
      .fontSize(15)
      .text(
        `PAYSLIP - ${monthName.toUpperCase()} ${year}`,
        {
          align: "center",
        }
      );

    doc.moveDown(1.5);
        //=========================================================
    // EMPLOYEE DETAILS
    //=========================================================

    const leftX = 35;
    const rightX = 320;

    const labelWidth = 95;
    const valueWidth = 150;

    let detailY = doc.y;

    const detailRowHeight = 24;

    const drawDetailRow = (
      leftLabel,
      leftValue,
      rightLabel,
      rightValue
    ) => {

      doc.font("Helvetica-Bold").fontSize(9);

      // Left Label

      doc.text(
        leftLabel,
        leftX,
        detailY,
        {
          width: labelWidth,
        }
      );

      // Left Value

      doc.font("Helvetica");

      doc.text(
        leftValue ? String(leftValue) : "-",
        leftX + labelWidth + 10,
        detailY,
        {
          width: valueWidth,
        }
      );

      // Right Label

      if (rightLabel) {

        doc.font("Helvetica-Bold");

        doc.text(
          rightLabel,
          rightX,
          detailY,
          {
            width: labelWidth,
          }
        );

        // Right Value

        doc.font("Helvetica");

        doc.text(
          rightValue ? String(rightValue) : "-",
          rightX + labelWidth + 10,
          detailY,
          {
            width: valueWidth,
          }
        );
      }

      detailY += detailRowHeight;

    };

    //=========================================================
    // ROWS
    //=========================================================

    drawDetailRow(
      "Employee Name",
      employee.fullName,
      "Employee Code",
      employee.employeeCode
    );

    drawDetailRow(
      "Department",
      payrollData.department,
      "Designation",
      payrollData.designation
    );

    drawDetailRow(
      "Joining Date",
      formatDate(employee.joiningDate),
      "Shift",
      payrollData.shiftName
    );

    drawDetailRow(
      "Pay Period",
      `${monthName} ${year}`,
      "Generated",
      formatDate(new Date())
    );

    drawDetailRow(
      "Working Days",
      payrollData.totalWorkingDays,
      "Paid Days",
      payrollData.paidDays
    );

    drawDetailRow(
      "Present Days",
      payrollData.presentDays,
      "Absent Days",
      payrollData.absentDays
    );

    drawDetailRow(
      "Paid Leave",
      payrollData.paidLeaveDays,
      "Holiday",
      payrollData.holidayDays
    );

    drawDetailRow(
      "Week Off",
      payrollData.weekOffDays,
      "",
      ""
    );

    //=========================================================
    // SPACE BEFORE TABLE
    //=========================================================

    let tableY = detailY + 25;
        //=========================================================
    // SALARY TABLE
    //=========================================================

    const tableRowHeight = 24;

    const earningsX = 35;
    const earningsWidth = 180;

    const amountX = earningsX + earningsWidth;
    const amountWidth = 90;

    const deductionX = amountX + amountWidth;
    const deductionWidth = 180;

    const deductionAmountX = deductionX + deductionWidth;
    const deductionAmountWidth = 90;

    //=========================================================
    // DRAW CELL
    //=========================================================

    const drawCell = (
      x,
      y,
      width,
      height,
      text,
      bold = false,
      align = "left",
      header = false
    ) => {

      if (header) {
        doc
          .save()
          .fillColor("#E6E6E6")
          .rect(x, y, width, height)
          .fill()
          .restore();
      }

      doc.rect(x, y, width, height).stroke();

      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .fillColor("black")
        .text(
          text !== undefined && text !== null
            ? String(text)
            : "",
          x + 5,
          y + 7,
          {
            width: width - 10,
            align,
          }
        );

    };

    //=========================================================
    // TABLE HEADER
    //=========================================================

    drawCell(
      earningsX,
      tableY,
      earningsWidth,
      tableRowHeight,
      "Earnings",
      true,
      "left",
      true
    );

    drawCell(
      amountX,
      tableY,
      amountWidth,
      tableRowHeight,
      "Amount",
      true,
      "right",
      true
    );

    drawCell(
      deductionX,
      tableY,
      deductionWidth,
      tableRowHeight,
      "Deductions",
      true,
      "left",
      true
    );

    drawCell(
      deductionAmountX,
      tableY,
      deductionAmountWidth,
      tableRowHeight,
      "Amount",
      true,
      "right",
      true
    );

    tableY += tableRowHeight;

    //=========================================================
    // EARNINGS / DEDUCTIONS
    //=========================================================

    const salaryRows = [
      [
        "Basic Salary",
        payrollData.basicSalary,
        "Provident Fund (PF)",
        payrollData.pfDeduction,
      ],

      [
        "House Rent Allowance",
        payrollData.hra,
        "ESI",
        payrollData.esiDeduction,
      ],

      [
        "Medical Allowance",
        payrollData.medicalAllowance,
        "",
        "",
      ],

      [
        "Conveyance Allowance",
        payrollData.conveyanceAllowance,
        "",
        "",
      ],

      [
        "Shift Allowance",
        payrollData.shiftAllowance,
        "",
        "",
      ],

      [
        "Other Allowance",
        payrollData.otherAllowance,
        "",
        "",
      ],
    ];

    salaryRows.forEach((item) => {

      drawCell(
        earningsX,
        tableY,
        earningsWidth,
        tableRowHeight,
        item[0]
      );

      drawCell(
        amountX,
        tableY,
        amountWidth,
        tableRowHeight,
        formatAmount(item[1]),
        false,
        "right"
      );

      drawCell(
        deductionX,
        tableY,
        deductionWidth,
        tableRowHeight,
        item[2]
      );

      drawCell(
        deductionAmountX,
        tableY,
        deductionAmountWidth,
        tableRowHeight,
        item[3] === ""
          ? ""
          : formatAmount(item[3]),
        false,
        "right"
      );

      tableY += tableRowHeight;

    });

    //=========================================================
    // TOTALS
    //=========================================================

    drawCell(
      earningsX,
      tableY,
      earningsWidth,
      tableRowHeight,
      "Gross Earnings",
      true
    );

    drawCell(
      amountX,
      tableY,
      amountWidth,
      tableRowHeight,
      formatAmount(payrollData.grossEarning),
      true,
      "right"
    );

    drawCell(
      deductionX,
      tableY,
      deductionWidth,
      tableRowHeight,
      "Total Deductions",
      true
    );

    drawCell(
      deductionAmountX,
      tableY,
      deductionAmountWidth,
      tableRowHeight,
      formatAmount(payrollData.totalDeduction),
      true,
      "right"
    );

    tableY += tableRowHeight;

    //=========================================================
    // NET SALARY
    //=========================================================

    drawCell(
      earningsX,
      tableY,
      earningsWidth + amountWidth,
      tableRowHeight,
      "NET SALARY",
      true,
      "center"
    );

    drawCell(
      deductionX,
      tableY,
      deductionWidth + deductionAmountWidth,
      tableRowHeight,
      formatAmount(payrollData.netSalary),
      true,
      "right"
    );

    tableY += 45;
        //=========================================================
    // AMOUNT IN WORDS
    //=========================================================

    tableY += 15;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(
        "Amount in Words :",
        35,
        tableY,
        {
          width: 120,
        }
      );

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        amountInWords(payrollData.netSalary),
        155,
        tableY,
        {
          width: 380,
          align: "left",
        }
      );

    //=========================================================
    // EXTRA SPACE
    //=========================================================

    tableY += 50;

    //=========================================================
    // FOOTER LINE
    //=========================================================

    doc
      .moveTo(35, tableY)
      .lineTo(560, tableY)
      .stroke();

    tableY += 15;

    //=========================================================
    // FOOTER TEXT
    //=========================================================

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(
        "This is a system generated payslip and does not require a signature.",
        35,
        tableY,
        {
          width: 525,
          align: "center",
        }
      );

    //=========================================================
    // SIGNATURE
    //=========================================================

    tableY += 45;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(
        "Authorized Signatory",
        405,
        tableY
      );

    //=========================================================
    // COMPANY NAME
    //=========================================================

    tableY += 18;

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(
        "Mounttown Technology Private Limited",
        355,
        tableY,
        {
          width: 180,
          align: "center",
        }
      );

    //=========================================================
    // CLOSE PDF
    //=========================================================

    doc.end();

    stream.on("finish", () => {
      resolve(`/uploads/payslips/${fileName}`);
    });

    stream.on("error", (err) => {
      reject(err);
    });

  });

};

module.exports = generatePayslip;