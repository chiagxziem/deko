import { createMiddleware } from "hono/factory";

import HttpStatusCodes from "@/lib/http-status-codes";
import { checkAndIncrementSlidingWindowRequests } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/utils";

// This middleware only enforces the per-second (100 requests) request limit.
// The per-minute event quota remains in the ingest route where batch size is known.
export const ingestRateLimit = createMiddleware(async (c, next) => {
  const serviceToken = c.req.header("x-deko-service-token");
  if (!serviceToken) {
    return c.json(
      errorResponse("MISSING_TOKEN", "Service token is required"),
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  const keySec = `ingest-rate-limit:${serviceToken}:sec`;
  const now = Date.now();
  const limitSec = 100;
  const windowMs = 1_000;

  try {
    // an atomic Redis script helper is used to ensure transaction isolation
    // and prevent race conditions
    const rateLimitResult = await checkAndIncrementSlidingWindowRequests(
      keySec,
      now,
      limitSec,
      windowMs,
    );

    if (!rateLimitResult.allowed) {
      return c.json(
        errorResponse(
          "TOO_MANY_REQUESTS",
          "Rate limit exceeded. Max 100 requests per second.",
        ),
        HttpStatusCodes.TOO_MANY_REQUESTS,
      );
    }
  } catch (error) {
    console.error("Ingest Rate Limit Error:", error);
    return c.json(
      errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Internal server error. Please try again later.",
      ),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  return next();
});
