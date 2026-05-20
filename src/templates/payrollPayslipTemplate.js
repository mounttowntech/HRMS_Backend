const payrollPayslipTemplate = (name, month, netSalary, companyName = "HRMS") => `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    
    <div style="background:#1d4ed8;color:white;padding:24px;text-align:center;">
      <h2 style="margin:0;">Payslip Generated</h2>
      <p style="margin:5px 0 0;">${month}</p>
    </div>

    <div style="padding:30px;color:#333;">
      <h3>Hello ${name},</h3>
      <p>Your payslip for <b>${month}</b> has been generated.</p>

      <div style="background:#eff6ff;padding:18px;border-radius:8px;">
        <p><b>Employee:</b> ${name}</p>
        <p><b>Month:</b> ${month}</p>
        <p><b>Net Salary:</b> ₹${netSalary}</p>
      </div>

      <p>Please login to HRMS to download your payslip.</p>

      <a href="#" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;">
        View Payslip
      </a>

      <p style="margin-top:30px;">Regards,<br/>Payroll Team</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = payrollPayslipTemplate;