// Test the fixed email template
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const SMTP_USER = process.env.EMAIL_SMTP_USER;
const SMTP_PASS = process.env.EMAIL_SMTP_PASS;
const FROM_EMAIL = process.env.EMAIL_FROM || "support@pathgen.dev";
const TEST_EMAIL = "benderaiden826@gmail.com";

if (!SMTP_USER || !SMTP_PASS) {
  console.error("ERROR: EMAIL_SMTP_USER and EMAIL_SMTP_PASS must be set");
  process.exit(1);
}

// Load the fixed HTML template
const templatePath = path.join(__dirname, "..", "pathgen-v2-announcement-email-fixed.html");
let html = fs.readFileSync(templatePath, "utf-8");

// Replace unsubscribe URL placeholder
const unsubscribeUrl = `https://pathgen.dev/unsubscribe?email=${encodeURIComponent(TEST_EMAIL)}`;
html = html.replace(/{{unsubscribe_url}}/g, unsubscribeUrl);

// Create transporter
const transporter = nodemailer.createTransport({
  host: "email-smtp.us-east-2.amazonaws.com",
  port: 587,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: true,
  },
});

async function sendFixedEmail() {
  try {
    console.log("Sending Fixed PathGen v2 Announcement Email...");
    console.log(`   From: ${FROM_EMAIL}`);
    console.log(`   To: ${TEST_EMAIL}`);
    console.log("");

    const info = await transporter.sendMail({
      from: `"PathGen" <${FROM_EMAIL}>`,
      to: TEST_EMAIL,
      subject: "PathGen v2 is Here! (Fixed)",
      html: html,
      text: "PathGen v2 is Here! The upgrade you've been waiting for to finally improve. Get instant feedback on your gameplay, analyze replays, and improve faster with AI-powered coaching. Visit https://pathgen.dev to get started.",
    });

    console.log("SUCCESS! Fixed email sent successfully!");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log(`\nCheck your inbox at: ${TEST_EMAIL}`);
    
    transporter.close();
    
  } catch (error) {
    console.error("\nERROR: Failed to send email");
    console.error(`   Error: ${error.message}`);
    
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    
    if (error.response) {
      console.error(`   SES Response: ${error.response}`);
    }
    
    process.exit(1);
  }
}

sendFixedEmail();

