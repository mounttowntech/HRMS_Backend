const nodemailer = require("nodemailer");
module.exports = async ({ to, subject, html }) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log("Mail skipped. Configure .env");
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });
  await transporter.sendMail({
    from: `HRMS <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
};
