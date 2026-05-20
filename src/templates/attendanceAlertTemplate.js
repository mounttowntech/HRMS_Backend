const attendanceAlertTemplate = (name, date, message, companyName = "HRMS") => `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    
    <div style="background:#dc2626;color:white;padding:24px;text-align:center;">
      <h2 style="margin:0;">Attendance Alert</h2>
    </div>

    <div style="padding:30px;color:#333;">
      <h3>Hello ${name},</h3>

      <div style="background:#fef2f2;border-left:5px solid #dc2626;padding:16px;border-radius:6px;">
        <p><b>Date:</b> ${date}</p>
        <p><b>Message:</b> ${message}</p>
      </div>

      <p>Please contact HR if this is incorrect.</p>

      <p style="margin-top:30px;">Regards,<br/>${companyName} HR Team</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = attendanceAlertTemplate;