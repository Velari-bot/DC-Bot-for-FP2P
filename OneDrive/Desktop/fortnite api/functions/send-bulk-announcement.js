// PathGen Email System — Send Bulk Announcement Email
// Sends the v2 announcement email to a list of recipients

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Get credentials from environment variables
const SMTP_USER = process.env.EMAIL_SMTP_USER;
const SMTP_PASS = process.env.EMAIL_SMTP_PASS;
const FROM_EMAIL = process.env.EMAIL_FROM || "support@pathgen.dev";

if (!SMTP_USER || !SMTP_PASS) {
  console.error("ERROR: EMAIL_SMTP_USER and EMAIL_SMTP_PASS must be set");
  process.exit(1);
}

// List of email addresses to send to
const RECIPIENTS = [
  "nerziontop@gmail.com",
  "brycenpattie@gmail.com",
  "eastonw1717@gmail.com",
  "honticpp@gmail.com",
  "0621mos@gmail.com",
  "evangelosmentzos09@gmail.com",
  "miron.podkorytov.cz@gmail.com",
  "elishirley111@gmail.com",
  "dannyvandenbroek9@gmail.com",
  "buziness.fn@gmail.com",
  "ashercampbell2015@gmail.com",
  "fabian.rodlev1@gmail.com",
  "jasoncool@freenet.de",
  "kdean506877@muhsdstudents.org",
  "braydenmartinez343@gmail.com",
  "pascalkeitel9@gmail.com",
  "bigbaggueteorangegamer@gmail.com",
  "anto27032010@gmail.com",
  "ben@sorrasolutions.com",
  "myniatv@gmail.com",
  "israelbeckford1@gmail.com",
  "import.person3@gmail.com",
  "benderaiden826@gmail.com",
  "landonhicks1113@gmail.com",
  "taylorhar21@gmail.com",
  "lyharry31@gmail.com",
  "mustidzanmustafov@gmail.com",
  "ljduh1st@gmail.com",
  "sodajoyhardhead18@gmail.com",
  "deranhabes24@gmail.com",
  "xxflyfriesxx@gmail.com",
  // "lew1vMj8R0X7NKLcF9GJ9d0Khts2", // Invalid - looks like a UID, not an email
  "levibraxton0@gmail.com",
  "kleelsuheimat@gmail.com",
  "alilikestobleron@outlook.com",
  "prodoclix@gmail.com",
  "apxfalcon375@gmail.com",
  "hisgorilla708@gmail.com",
  "darelsubed@gmail.com",
  "trrmubfywwbgbgyxuy@nespj.com",
  "jackclasper.17@gmail.com",
  "coleemusser@gmail.com",
  "legendbigdih@gmail.com",
  "chukambah10@gmail.com",
  "billexa2025@gmail.com",
  "officialartic1@gmail.com",
  "finlay.j.c.lewis@gmail.com",
  "m3psiscool@gmail.com",
  "corbinconner089@gmail.com",
  "szalmarafael0225@gmail.com",
  "eugeneelixboateng@gmail.com",
  "offcialartic1@gmail.com",
  "kubafilar110@gmail.com",
  "modelingject@gmail.com",
  "colton.bjerke@icloud.com",
  "harshpaul523@gmail.com",
  "jakelestremertrx@gmail.com",
  "milosawt23@gmail.com",
  "voidgamingclips2023@gmail.com",
  "aayan.b.asim@gmail.com",
  "mananalizayd@gmail.com",
  "fudgecake3735@gmail.com",
  "jonesfn6769@gmail.com",
  "itzsigmasjr@gmail.com",
  "itsjony54@gmail.com",
  "pacoryan89@gmail.com",
  "ryder3290@gmail.com",
];

// Load the announcement HTML template
const templatePath = path.join(__dirname, "..", "pathgen-v2-announcement-email.html");
let html = fs.readFileSync(templatePath, "utf-8");

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

// Validate email addresses
const validator = require("validator");
const validEmails = [];
const invalidEmails = [];

RECIPIENTS.forEach((email) => {
  if (validator.isEmail(email)) {
    validEmails.push(email);
  } else {
    invalidEmails.push(email);
  }
});

console.log(`\n📧 PathGen v2 Announcement Bulk Email`);
console.log(`   Total recipients: ${RECIPIENTS.length}`);
console.log(`   Valid emails: ${validEmails.length}`);
if (invalidEmails.length > 0) {
  console.log(`   Invalid emails: ${invalidEmails.length}`);
  console.log(`   Invalid: ${invalidEmails.join(", ")}`);
}
console.log(`\n   From: ${FROM_EMAIL}`);
console.log(`   Subject: PathGen v2 is Here!`);
console.log(`\n   Starting bulk send...\n`);

// Send emails in batches (AWS SES limit: 50 per batch)
const BATCH_SIZE = 50;
let sentCount = 0;
let failedCount = 0;
const failedEmails = [];

async function sendBatch(emails, batchNum) {
  const promises = emails.map(async (email) => {
    try {
      // Replace unsubscribe URL for each recipient
      const unsubscribeUrl = `https://pathgen.dev/unsubscribe?email=${encodeURIComponent(email)}`;
      const personalizedHtml = html.replace(/{{unsubscribe_url}}/g, unsubscribeUrl);

      // Create message without configuration set to avoid AWS SES default config issues
      const message = {
        from: `"PathGen" <${FROM_EMAIL}>`,
        to: email,
        subject: "PathGen v2 is Here!",
        html: personalizedHtml,
        text: "PathGen v2 is Here! The upgrade you've been waiting for to finally improve. Get instant feedback on your gameplay, analyze replays, and improve faster with AI-powered coaching. Visit https://pathgen.dev to get started.",
      };
      
      // Explicitly don't set configuration set to avoid default config issues
      // AWS SES will use account defaults if not specified, but we want to avoid that
      
      const info = await transporter.sendMail(message);

      sentCount++;
      console.log(`   ✓ [${sentCount}/${validEmails.length}] Sent to: ${email}`);
      return { success: true, email, messageId: info.messageId };
    } catch (error) {
      failedCount++;
      failedEmails.push({ email, error: error.message });
      console.error(`   ✗ [FAILED] ${email}: ${error.message}`);
      return { success: false, email, error: error.message };
    }
  });

  return Promise.all(promises);
}

async function sendAllEmails() {
  const startTime = Date.now();

  // Send in batches
  for (let i = 0; i < validEmails.length; i += BATCH_SIZE) {
    const batch = validEmails.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`\n   Batch ${batchNum} (${batch.length} emails)...`);
    
    await sendBatch(batch, batchNum);
    
    // Wait 1 second between batches to respect rate limits
    if (i + BATCH_SIZE < validEmails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n\n📊 Bulk Email Summary`);
  console.log(`   ✅ Successfully sent: ${sentCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   ⏱️  Duration: ${duration}s`);
  
  if (failedEmails.length > 0) {
    console.log(`\n   Failed emails:`);
    failedEmails.forEach(({ email, error }) => {
      console.log(`      - ${email}: ${error}`);
    });
  }

  transporter.close();
  
  if (failedCount === 0) {
    console.log(`\n   🎉 All emails sent successfully!`);
    process.exit(0);
  } else {
    console.log(`\n   ⚠️  Some emails failed. Check the list above.`);
    process.exit(1);
  }
}

sendAllEmails().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  transporter.close();
  process.exit(1);
});

