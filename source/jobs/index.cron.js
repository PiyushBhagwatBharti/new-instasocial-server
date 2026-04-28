import cron from "node-cron";
import { runPostJob } from "./post.jobs.js";

// Runs every 5 minutes
const scheduleJob = cron.schedule(
  "*/2 * * * *",
  async () => {
    console.log("[CRON] uploading posts");
    await runPostJob();
  },
  { scheduled: false },
);

export default {
  start() {
    scheduleJob.start();
    console.log("[CRON] Jobs started");
  },
};
