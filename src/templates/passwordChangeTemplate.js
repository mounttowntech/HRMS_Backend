const passwordChangedTemplate = (name, companyName = "Mounttown HRMS") => `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    
    <div style="background:#16a34a;color:white;padding:24px;text-align:center;">
      <h2 style="margin:0;">${companyName}</h2>
      <p style="margin:5px 0 0;">Password Changed Successfully</p>
    </div>

    <div style="padding:30px;color:#333;">
      <h3>Hello ${name},</h3>

      <p>Your HRMS account password has been changed successfully.</p>

      <p>If you did not make this change, please contact your HR/Admin immediately.</p>

      <a href="http://localhost:3000/login"
        style="display:inline-block;background:#16a34a;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;">
        Login Now
      </a>

      <p style="margin-top:30px;">Regards,<br/>HR Team</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = passwordChangedTemplate;