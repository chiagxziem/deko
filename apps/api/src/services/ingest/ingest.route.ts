import { LogSchema } from "@repo/db/validators/log.validator";
import { logEventsQueue } from "@repo/redis";
import { validator } from "hono-openapi";

import { createRouter } from "@/app";
import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse, normalizeLevel, successResponse } from "@/lib/utils";
import { validationHook } from "@/middleware/validation-hook";
import { getProjectByToken } from "@/queries/project-queries";
import { ingestLogDoc } from "./ingest.docs";

const ingest = createRouter();

// TODO: add rate limiting: 10_000 events per minute per project token,
// TODO: and a max of 100 requests per second per project token

ingest.get(
  "/",
  ingestLogDoc,
  validator("json", LogSchema, validationHook),
  // TODO: allow for bulk events
  async (c) => {
    const log = c.req.valid("json");

    const project = await getProjectByToken(log.projectToken);

    if (!project) {
      return c.json(
        errorResponse("INVALID_TOKEN", "Invalid or non-existing project token"),
        HttpStatusCodes.UNAUTHORIZED,
      );
    }

    if (log.status < 100 || log.status > 599) {
      return c.json(
        errorResponse(
          "INVALID_STATUS",
          "Invalid status code. Status code must be between 100 and 599.",
        ),
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
      );
    }

    const { projectToken: _pt, ...logEvent } = {
      ...log,
      projectId: project.id,
      receivedAt: new Date(),
      level: normalizeLevel(log.level),
      method: log.method.toLowerCase() as typeof log.method,
      // TODO: add ipHashed and userAgent if available
      // TODO: make sure the IP address is hashed
    };

    await logEventsQueue.add("log-event", logEvent, {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 500,
      },
      removeOnComplete: 1000,
      removeOnFail: 2000,
    });

    return c.json(
      successResponse({ status: "ok" }, "Log ingested successfully"),
      HttpStatusCodes.OK,
    );
  },
);

export default ingest;
