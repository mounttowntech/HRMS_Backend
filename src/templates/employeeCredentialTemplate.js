const employeeCredentialsTemplate = (name, email, password, companyName = "HRMS") => `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    
    <div style="background:#2563eb;color:#ffffff;padding:24px;text-align:center;">
      <h2 style="margin:0;">${companyName}</h2>
      <p style="margin:5px 0 0;">Employee Login Credentials</p>
    </div>

    <div style="padding:30px;color:#333;">
      <h3>Hello ${name},</h3>
      <p>Your HRMS login account has been created successfully.</p>

      <div style="background:#f1f5f9;padding:18px;border-radius:8px;margin:20px 0;">
        <p><b>Email:</b> ${email}</p>
        <p><b>Password:</b> ${password}</p>
      </div>

      <p>Please login and change your password after your first login.</p>

      <a href="#" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;">
        Login Now
      </a>

      <p style="margin-top:30px;">Regards,<br/>HR Team</p>
    </div>

    <div style="background:#f9fafb;text-align:center;padding:14px;font-size:12px;color:#6b7280;">
      © ${new Date().getFullYear()} ${companyName}. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

module.exports = employeeCredentialsTemplate;