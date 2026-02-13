// PathGen Email System — Schedule Bulk Announcement Email
// Schedules the bulk email to be sent tomorrow at 4pm EST

const cron = require("node-cron");
const { exec } = require("child_process");
const path = require("path");

// Calculate tomorrow at 4pm EST
function getTomorrow4pmEST() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(16, 0, 0, 0); // 4pm
  
  // Convert to EST (UTC-5) - adjust if needed for DST
  const estOffset = -5 * 60; // EST is UTC-5
  const estTime = new Date(tomorrow.getTime() - (estOffset * 60 * 1000));
  
  return estTime;
}

// Convert to cron format (minute hour day month dayOfWeek)
function dateToCron(date) {
  const minutes = date.getMinutes();
  const hours = date.getHours();
  const day = date.getDate();
  const month = date.getMonth() + 1; // Cron months are 1-12
  
  return `${minutes} ${hours} ${day} ${month} *`;
}

const targetDate = getTomorrow4pmEST();
const cronExpression = dateToCron(targetDate);

console.log("📅 Scheduling PathGen v2 Announcement Email");
console.log(`   Scheduled for: ${targetDate.toLocaleString("en-US", { timeZone: "America/New_York" })} EST`);
console.log(`   Cron expression: ${cronExpression}`);
console.log(`\n   Waiting for scheduled time...\n`);

// Schedule the email
const task = cron.schedule(cronExpression, () => {
  console.log("⏰ Scheduled time reached! Sending emails...\n");
  
  const scriptPath = path.join(__dirname, "send-bulk-announcement.js");
  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
    
    // Stop the cron job after running
    task.stop();
    process.exit(0);
  });
}, {
  scheduled: true,
  timezone: "America/New_York"
});

// Keep the process running
console.log("   Script is running and will send emails at the scheduled time.");
console.log("   Press Ctrl+C to cancel.\n");

