const welcomeKitTemplate = (name, companyName = "HRMS") => `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    
    <div style="background:#0f766e;color:white;padding:24px;text-align:center;">
      <h2 style="margin:0;">Welcome Kit</h2>
    </div>

    <div style="padding:30px;color:#333;">
      <h3>Hello ${name},</h3>
      <p>Welcome to ${companyName}. Your welcome kit includes:</p>

      <ul style="background:#f0fdfa;padding:20px 20px 20px 40px;border-radius:8px;line-height:1.8;">
        <li>Employee ID Card</li>
        <li>Employee Handbook</li>
        <li>System Access Details</li>
        <li>HR Contact Information</li>
      </ul>

      <p>We are excited to have you with us.</p>

      <p style="margin-top:30px;">Regards,<br/>HR Team</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = welcomeKitTemplate;