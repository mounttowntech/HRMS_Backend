const accountActivationTemplate = (name, email, password, companyName = "HRMS") => `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    
    <div style="background:#059669;color:white;padding:24px;text-align:center;">
      <h2 style="margin:0;">Account Activated</h2>
    </div>

    <div style="padding:30px;color:#333;">
      <h3>Hello ${name},</h3>
      <p>Your HRMS account has been activated successfully.</p>

      <div style="background:#ecfdf5;padding:18px;border-radius:8px;">
        <p><b>Email:</b> ${email}</p>
        <p><b>Password:</b> ${password}</p>
        <p><b>Status:</b> Active</p>
      </div>

      <a href="#" style="display:inline-block;background:#059669;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;">
        Login to HRMS
      </a>

      <p style="margin-top:30px;">Regards,<br/>HR Team</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = accountActivationTemplate;