import dotenv from "dotenv";
import server from "./server.js";
import { Environment, getEnv } from "./utils/env.js";
import JobService from "./jobs/service.js";

if (getEnv() === Environment.Local) {
  dotenv.config();
}

const port = process.env.PORT || 8080;

// Start REST API
server().listen(port);

// Start job runner
const jobService = new JobService();
await jobService.startScheduledJobRunners();
