import { enqueueLogEvent } from "@/lib/queue";
import type { AppRouteHandler } from "@/lib/types";
import { getProjectByToken } from "@/queries/project-queries";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { IngestLogRoute } from "./ingest.routes";

export const ingestLog: AppRouteHandler<IngestLogRoute> = async (c) => {
  const log = c.req.valid("json");

  const project = await getProjectByToken(log.projectToken);

  if (!project) {
    return c.json(
      errorResponse("NOT_FOUND", "Project not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  const { projectToken: _pt, ...logWithProjectId } = {
    ...log,
    projectId: project.id,
  };

  await enqueueLogEvent(logWithProjectId);

  return c.json(
    successResponse({ status: "ok" }, "Log ingested successfully"),
    HttpStatusCodes.OK,
  );
};
