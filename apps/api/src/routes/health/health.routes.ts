import { createRoute, z } from "@hono/zod-openapi";

import HttpStatusCodes from "@/utils/http-status-codes";
import {
  genericErrorContent,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Health"];

export const checkAPIHealth = createRoute({
  path: "/health",
  method: "get",
  tags,
  description: "Check API health status",
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "API is healthy",
      schema: z.object({
        status: z.string().default("ok"),
      }),
      resObj: {
        details: "API is healthy",
        data: {
          status: "ok",
        },
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: genericErrorContent(
      "TOO_MANY_REQUESTS",
      "Too many requests",
      "Too many requests have been made. Please try again later.",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type CheckAPIHealthRoute = typeof checkAPIHealth;
