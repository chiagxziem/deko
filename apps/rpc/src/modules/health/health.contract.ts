import z from "zod";

import HttpStatusCodes from "../../lib/http-status-codes";
import {
  createErrorDescriptions,
  createSuccessSchema,
} from "../../lib/openapi";
import { ocBase } from "../../lib/orpc";

const checkHealth = ocBase
  .route({
    path: "/health",
    method: "GET",
    tags: ["health"],
    description: "Check API health status",
    successStatus: 200,
    successDescription: "API is healthy",
    spec: (current) => {
      return {
        ...current,
        responses: {
          ...current.responses,
          ...createErrorDescriptions(current.responses, {
            [HttpStatusCodes.TOO_MANY_REQUESTS]: "Too many requests",
            [HttpStatusCodes.INTERNAL_SERVER_ERROR]: "Internal server error",
          }),
        },
      };
    },
  })
  .output(
    createSuccessSchema(
      "API is healthy",
      z.object({ status: z.literal("ok") }),
    ),
  );

export default { checkHealth };
