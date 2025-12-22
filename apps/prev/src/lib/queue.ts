import type { Log } from "@repo/db/validators/log.validator";
import { logEventsQueue } from "@repo/redis";

export const enqueueLogEvent = async (
  logEvent: Omit<Log, "projectToken"> & { projectId: string },
) => {
  await logEventsQueue.add("log-event", logEvent, {
    attempts: 3,
    removeOnComplete: 1000,
    removeOnFail: 2000,
  });
};
