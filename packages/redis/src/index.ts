import { RedisClient } from "bun";

import { Queue } from "bullmq";

import env from "./lib/env";

export const redisClient = new RedisClient(env.REDIS_URL);

export const logEventsQueue = new Queue("log-events", {
  connection: {
    url: env.REDIS_URL,
    maxRetriesPerRequest: 3,
  },
});
