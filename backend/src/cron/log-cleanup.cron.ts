import cron from "node-cron";
import prisma from "../config/database";
import logger from "../utils/logger.util";

export async function deleteOldLogs(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const result = await prisma.log.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });

    if (result.count > 0) {
      logger.info(
        `[LogCleanup] Deleted ${result.count} log record(s) older than ${cutoff.toISOString()}`,
      );
    } else {
      logger.info(
        `[LogCleanup] No logs older than 24 h found — nothing deleted.`,
      );
    }
  } catch (error) {
    logger.error("[LogCleanup] Failed to delete old logs:", error);
  }
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

/**
 * Registers the log-cleanup cron job.
 * Call once from server.ts after the DB connection is confirmed.
 *
 * Schedule breakdown:
 *   "0 * * * *"  →  minute 0 of every hour, every day
 *
 * Change to "0 0 * * *" if once-per-day (midnight) is sufficient.
 */
export function startLogCleanupCron(): void {
  const schedule = "0 * * * *"; // every hour at :00

  if (!cron.validate(schedule)) {
    logger.error(
      `[LogCleanup] Invalid cron schedule: "${schedule}" — job not started.`,
    );
    return;
  }

  cron.schedule(schedule, async () => {
    logger.info("[LogCleanup] Cron triggered — starting log cleanup...");
    await deleteOldLogs();
  });

  logger.info(
    `[LogCleanup] Cron job registered. Schedule: "${schedule}" (every hour).`,
  );
}
