const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
    attachments,
  };
  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

module.exports = { sendEmail };
