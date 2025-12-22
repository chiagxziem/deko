import { LogSchema } from "@repo/db/validators/log.validator";
import { logEventsQueue } from "@repo/redis";
import { validator } from "hono-openapi";

import { createRouter } from "@/app";
import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse, successResponse } from "@/lib/utils";
import { validationHook } from "@/middleware/validation-hook";
import { getProjectByToken } from "@/queries/project-queries";
import { ingestLogDoc } from "./ingest.docs";

const ingest = createRouter();

ingest.get(
  "/",
  ingestLogDoc,
  validator("json", LogSchema, validationHook),
  async (c) => {
    const log = c.req.valid("json");

    const project = await getProjectByToken(log.projectToken);

    if (!project) {
      return c.json(
        errorResponse("INVALID_TOKEN", "Invalid or non-existing project token"),
        HttpStatusCodes.UNAUTHORIZED,
      );
    }

    const { projectToken: _pt, ...logEvent } = {
      ...log,
      projectId: project.id,
    };

    await logEventsQueue.add("log-event", logEvent, {
      attempts: 3,
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
