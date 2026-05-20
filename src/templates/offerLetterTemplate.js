const offerLetterTemplate = (name, designation, joiningDate, companyName = "HRMS") => `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <div style="max-width:650px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    
    <div style="background:#7c3aed;color:white;padding:26px;text-align:center;">
      <h2 style="margin:0;">Offer Letter</h2>
      <p style="margin:5px 0 0;">${companyName}</p>
    </div>

    <div style="padding:32px;color:#333;line-height:1.6;">
      <h3>Dear ${name},</h3>

      <p>
        We are pleased to offer you the position of 
        <b>${designation}</b> at <b>${companyName}</b>.
      </p>

      <div style="background:#f5f3ff;padding:18px;border-radius:8px;margin:20px 0;">
        <p><b>Designation:</b> ${designation}</p>
        <p><b>Joining Date:</b> ${joiningDate}</p>
      </div>

      <p>Please confirm your acceptance of this offer.</p>

      <a href="#" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;">
        Accept Offer
      </a>

      <p style="margin-top:30px;">Regards,<br/>HR Team</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = offerLetterTemplate;