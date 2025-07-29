import { cache, logger, shutdownOperation, timeOperation } from "@intmax2-function/shared";
import { name } from "../package.json";
import { INTERVAL_MS } from "./constants";
import { startHealthCheckServer } from "./lib/healthCheck";
import { performJob } from "./service/job.service";

async function executeJob() {
  try {
    logger.info(`Starting ${name} job`);
    const { durationInSeconds } = await timeOperation(performJob);
    logger.info(`Completed ${name} job executed successfully in ${durationInSeconds}s`);
    console.log("durationInSeconds:", durationInSeconds);
    return Number(durationInSeconds) * 1000;
  } catch (error) {
    logger.error(`Job execution failed:`, error);
    return 0;
  }
}

async function scheduleNextExecution() {
  const executionTimeMs = await executeJob();

  const waitTime = Math.max(0, INTERVAL_MS - executionTimeMs);

  logger.info(`Job took ${executionTimeMs}ms, waiting ${waitTime}ms until next execution`);

  setTimeout(() => {
    scheduleNextExecution();
  }, waitTime);
}

async function main() {
  try {
    await startHealthCheckServer();
    logger.info("Health check server started successfully");
  } catch (error) {
    logger.error("Failed to start health check server:", error);
    throw error;
  }

  logger.info(`Starting ${name} adaptive interval job (target interval: ${INTERVAL_MS / 1000}s)`);

  scheduleNextExecution();
}

process.on("unhandledRejection", async (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
  await shutdownOperation(() => cache.flushAll());
});

process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  await shutdownOperation(() => cache.flushAll());
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  await shutdownOperation(() => cache.flushAll());
});

if (require.main === module) {
  main().catch((error) => {
    logger.error(error);
    process.exit(1);
  });
}
