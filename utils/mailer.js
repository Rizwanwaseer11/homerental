// utils/mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Reusable Nodemailer transporter
 * Configure it with your email service or SMTP provider
 */
const transporter = nodemailer.createTransport({
  service: "gmail", // or 'SendGrid', 'Mailgun', 'Zoho', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 */
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Home Rental" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Email sending failed to ${to}:`, err.message);
    throw new Error("Email sending failed");
  }
}

module.exports = sendEmail;
