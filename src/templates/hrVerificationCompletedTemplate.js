const hrVerificationCompletedTemplate = (name, companyName = "HRMS") => `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    
    <div style="background:#16a34a;color:white;padding:24px;text-align:center;">
      <h2 style="margin:0;">HR Verification Completed</h2>
    </div>

    <div style="padding:30px;color:#333;">
      <h3>Hello ${name},</h3>
      <p>Your HR verification has been completed successfully.</p>

      <div style="background:#ecfdf5;border-left:5px solid #16a34a;padding:16px;border-radius:6px;">
        <b>Status:</b> Verified by HR
      </div>

      <p>Your onboarding has now moved to admin access assignment.</p>

      <p style="margin-top:30px;">Regards,<br/>${companyName} HR Team</p>
    </div>

    <div style="background:#f9fafb;text-align:center;padding:14px;font-size:12px;color:#6b7280;">
      © ${new Date().getFullYear()} ${companyName}
    </div>
  </div>
</body>
</html>
`;

module.exports = hrVerificationCompletedTemplate;