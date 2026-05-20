const leaveApprovalTemplate = (name, leaveType, fromDate, toDate, status, companyName = "HRMS") => `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    
    <div style="background:#f59e0b;color:white;padding:24px;text-align:center;">
      <h2 style="margin:0;">Leave Request ${status}</h2>
    </div>

    <div style="padding:30px;color:#333;">
      <h3>Hello ${name},</h3>
      <p>Your leave request has been updated.</p>

      <div style="background:#fffbeb;padding:18px;border-radius:8px;">
        <p><b>Leave Type:</b> ${leaveType}</p>
        <p><b>From:</b> ${fromDate}</p>
        <p><b>To:</b> ${toDate}</p>
        <p><b>Status:</b> ${status}</p>
      </div>

      <p style="margin-top:30px;">Regards,<br/>${companyName} HR Team</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = leaveApprovalTemplate;