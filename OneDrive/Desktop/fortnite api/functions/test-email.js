// PathGen Email System — Test Script
// Tests AWS SES email sending with your SMTP credentials

const nodemailer = require("nodemailer");
require("dotenv").config();

// Get credentials from environment variables
const SMTP_USER = process.env.EMAIL_SMTP_USER;
const SMTP_PASS = process.env.EMAIL_SMTP_PASS;
const FROM_EMAIL = process.env.EMAIL_FROM || "support@pathgen.dev";
const TEST_EMAIL = process.env.TEST_EMAIL || "youremail@example.com";

if (!SMTP_USER || !SMTP_PASS) {
  console.error("❌ ERROR: EMAIL_SMTP_USER and EMAIL_SMTP_PASS must be set in environment variables");
  console.error("\nSet them in .env file or run:");
  console.error("  EMAIL_SMTP_USER=your_username EMAIL_SMTP_PASS=your_password node test-email.js");
  process.exit(1);
}

if (TEST_EMAIL === "youremail@example.com") {
  console.warn("⚠️  WARNING: Using default test email. Set TEST_EMAIL environment variable to test with your email.");
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: "email-smtp.us-east-2.amazonaws.com",
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: true,
  },
});

async function sendTestEmail() {
  try {
    console.log("📧 Testing PathGen Email System...");
    console.log(`   From: ${FROM_EMAIL}`);
    console.log(`   To: ${TEST_EMAIL}`);
    console.log(`   SMTP Host: email-smtp.us-east-2.amazonaws.com`);
    console.log(`   SMTP Port: 587\n`);

    const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background: #0A0A0A; color: #FFFFFF; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #151515; padding: 30px; border-radius: 12px; }
            h1 { color: #A78BFA; }
            .success { color: #00FFAA; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>PathGen SES Test Email</h1>
            <p class="success">If you're reading this, AWS SES is working correctly!</p>
            <p>This email was sent from PathGen's email system using AWS SES SMTP.</p>
            <hr style="border-color: #333; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              Sent via: email-smtp.us-east-2.amazonaws.com
            </p>
          </div>
        </body>
        </html>
      `;

    const mailOptions = {
      from: `"PathGen Support" <${FROM_EMAIL}>`,
      to: TEST_EMAIL,
      subject: "PathGen SES Test Email",
      html: htmlTemplate,
      text: "PathGen SES Test Email\n\nIf you're reading this, AWS SES is working correctly!",
    };

    // Don't set configuration set - let AWS SES use account defaults
    // If you need to use PathGen-Email-Events, set it in AWS SES account settings
    // or uncomment below:
    // mailOptions.ses = { ConfigurationSetName: "PathGen-Email-Events" };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ SUCCESS! Email sent successfully!");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log(`\n📬 Check your inbox at: ${TEST_EMAIL}`);
    
    // Close the connection
    transporter.close();
    
  } catch (error) {
    console.error("\n❌ ERROR: Failed to send email");
    console.error(`   Error: ${error.message}`);
    
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    
    if (error.response) {
      console.error(`   SES Response: ${error.response}`);
    }
    
    if (error.responseCode) {
      console.error(`   Response Code: ${error.responseCode}`);
    }
    
    console.error("\n💡 Troubleshooting:");
    console.error("   1. Verify EMAIL_SMTP_USER and EMAIL_SMTP_PASS are correct");
    console.error("   2. Check AWS SES is not in sandbox mode (or verify recipient email)");
    console.error("   3. Verify domain is verified in AWS SES");
    console.error("   4. Check SMTP credentials are active in AWS SES");
    
    process.exit(1);
  }
}

// Run the test
sendTestEmail();

