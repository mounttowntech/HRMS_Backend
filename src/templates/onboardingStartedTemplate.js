const onboardingStartedTemplate = (
  name,
  companyName = "HRMS"
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Onboarding Started</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f4f6f8;
  font-family:Arial,sans-serif;
">

  <div style="
    max-width:650px;
    margin:30px auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    border:1px solid #e5e7eb;
  ">

    <!-- HEADER -->
    <div style="
      background:#4f46e5;
      color:#ffffff;
      padding:30px;
      text-align:center;
    ">
      <h1 style="margin:0;font-size:28px;">
        Welcome to ${companyName}
      </h1>

      <p style="
        margin-top:10px;
        font-size:15px;
        opacity:0.9;
      ">
        Your onboarding process has started
      </p>
    </div>

    <!-- BODY -->
    <div style="
      padding:35px;
      color:#333333;
      line-height:1.7;
    ">

      <h2 style="margin-top:0;">
        Hello ${name},
      </h2>

      <p>
        We are excited to welcome you to 
        <b>${companyName}</b>.
      </p>

      <p>
        Your onboarding process has been 
        started successfully.
      </p>

      <!-- STEP BOX -->
      <div style="
        background:#f5f3ff;
        border-left:5px solid #4f46e5;
        padding:20px;
        border-radius:8px;
        margin:25px 0;
      ">

        <h3 style="
          margin-top:0;
          color:#4f46e5;
        ">
          Onboarding Steps
        </h3>

        <ul style="
          padding-left:20px;
          margin-bottom:0;
        ">
          <li>Complete Personal Information</li>
          <li>Upload Required Documents</li>
          <li>Verify Job Information</li>
          <li>HR Verification</li>
          <li>Admin Access Assignment</li>
        </ul>
      </div>

      <p>
        Please complete all onboarding steps 
        as soon as possible.
      </p>

      <!-- BUTTON -->
      <div style="margin:35px 0;text-align:center;">
        <a href="#"
          style="
            background:#4f46e5;
            color:#ffffff;
            padding:14px 28px;
            text-decoration:none;
            border-radius:8px;
            font-size:15px;
            font-weight:bold;
            display:inline-block;
          "
        >
          Start Onboarding
        </a>
      </div>

      <p>
        If you have any questions, feel free 
        to contact the HR team.
      </p>

      <br />

      <p>
        Regards,<br />
        <b>HR Team</b><br />
        ${companyName}
      </p>

    </div>

    <!-- FOOTER -->
    <div style="
      background:#f9fafb;
      padding:18px;
      text-align:center;
      font-size:12px;
      color:#6b7280;
    ">
      © ${new Date().getFullYear()} 
      ${companyName}. All rights reserved.
    </div>

  </div>

</body>
</html>
`;

module.exports = onboardingStartedTemplate;