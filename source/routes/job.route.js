import { Router } from "express";
import { runPostJob } from "../jobs/post.jobs.js";

export const JobRouter = Router();

JobRouter.post("/post", async (req, res) => {
  await runPostJob();
  return res.sendStatus(200);
});
