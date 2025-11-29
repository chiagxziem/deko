import { Queue } from "bullmq";

import env from "@/lib/env";

export const logEventsQueue = new Queue("log-events", {
  connection: {
    url: env.REDIS_URL,
  },
});
