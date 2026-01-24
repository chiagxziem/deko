import { createMiddleware } from "hono/factory";

import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse } from "@/lib/utils";
import { redisClient as redis } from "@repo/redis";

export const ingestRateLimit = createMiddleware(async (c, next) => {
  const serviceToken = c.req.header("x-logr-service-token");
  if (!serviceToken) {
    return c.json(
      errorResponse("MISSING_TOKEN", "Service token is required"),
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  // only the per-second request limit is checked here to prevent connection spam
  // the per-minute event quota is checked in the ingest route
  // this implements the "100 requests per second" logic accurately by counting requests

  const keySec = `ingest-rate-limit:${serviceToken}:sec`;
  const now = Date.now();
  const limitSec = 100;

  try {
    await redis.send("MULTI", []);
    await redis.send("ZREMRANGEBYSCORE", [keySec, "0", (now - 1_000).toString()]);
    await redis.send("ZCARD", [keySec]);

    const results = (await redis.send("EXEC", [])) as any[];
    const currentCountSec = results[1] ?? 0;

    if (currentCountSec >= limitSec) {
      return c.json(
        errorResponse("TOO_MANY_REQUESTS", "Rate limit exceeded. Max 100 requests per second."),
        HttpStatusCodes.TOO_MANY_REQUESTS,
      );
    }

    // register this request in the per-second window
    const member = `${now}-${Math.random().toString(36).substring(2, 7)}`;
    await redis.send("MULTI", []);
    await redis.send("ZADD", [keySec, now.toString(), member]);
    await redis.send("PEXPIRE", [keySec, "1000"]);
    await redis.send("EXEC", []);
  } catch (error) {
    console.error("Ingest Rate Limit Error:", error);
    return c.json(
      errorResponse("INTERNAL_SERVER_ERROR", "Internal server error. Please try again later."),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  return next();
});
