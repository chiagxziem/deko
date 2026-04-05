import { UnrecoverableError, Worker } from "bullmq";

import { db } from "@repo/db";
import { deadLetter, logEvent } from "@repo/db/schemas/event.schema";
import { type Event, EventSchema } from "@repo/db/validators/log.validator";

import env from "@/lib/env";

import { scrubPII } from "./lib/scrub";

// Normalize queue timestamp-like values into ISO strings so they match the
// EventSchema input contract
const toIsoString = (value: unknown, fieldName: "timestamp" | "receivedAt") => {
  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new UnrecoverableError(
      `Validation of event failed: invalid ${fieldName} value`,
    );
  }

  return date.toISOString();
};

const logEventsWorker = new Worker<Event, void>(
  "log-events",
  async (job) => {
    // Normalize timestamp fields before validation because EventSchema expects ISO
    // datetime input and transforms it to Date internally
    const normalizedJobData = {
      ...job.data,
      timestamp: toIsoString(job.data.timestamp, "timestamp"),
      receivedAt: toIsoString(job.data.receivedAt, "receivedAt"),
    };

    // re-validate event from queue so worker-side storage stays schema-safe
    const eventValidation = EventSchema.safeParse(normalizedJobData);

    if (!eventValidation.success) {
      const errorMsg = `Validation of event ${job.data.requestId} failed!`;
      console.error(errorMsg, eventValidation.error);
      throw new UnrecoverableError(errorMsg);
    }

    let eventData = eventValidation.data;

    // Apply PII scrubbing
    try {
      eventData = scrubPII(eventData);
    } catch (error) {
      console.warn(
        `PII scrubbing failed for job ${job.id}, proceeding with raw data:`,
        error,
      );
    }

    // Write to log_event table
    try {
      await db.insert(logEvent).values(eventData);
    } catch (error) {
      console.error(`Failed to insert event ${eventData.requestId}:`, error);
      throw error;
    }
  },
  {
    autorun: false,
    concurrency: 10,
    connection: {
      url: env.REDIS_URL,
    },
  },
);

console.log("Starting log events worker...");
void logEventsWorker.run();

logEventsWorker.on("completed", (job) => {
  if (process.env.NODE_ENV === "production") return;
  console.log(`[Job ${job.id}] COMPLETED`);
});

// If a job fails, move it to the dead_letter table
logEventsWorker.on("failed", async (job, error) => {
  const attempts = job?.attemptsMade ?? 0;
  const maxAttempts = job?.opts.attempts ?? 1;

  console.error(
    `[Job ${job?.id}] FAILED (${attempts}/${maxAttempts}) - RequestId: ${job?.data.requestId}:`,
    error.message,
  );

  // Dead-letter unrecoverable jobs
  if (job && attempts >= maxAttempts) {
    console.warn(`[Job ${job.id}] Moving to dead-letter...`);

    try {
      await db.insert(deadLetter).values({
        serviceId: job.data.serviceId,
        reason: error.message,
        payload: job.data,
      });
    } catch (dlError) {
      console.error(
        `[Job ${job.id}] CRITICAL: Failed to move to dead-letter:`,
        dlError,
      );
    }
  }
});

logEventsWorker.on("error", (error) => {
  console.error("WORKER ERROR:", error);
});

const shutdown = async () => {
  console.log("Shutting down log-events worker...");
  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => process.exit(1), 10000);
  await logEventsWorker.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
