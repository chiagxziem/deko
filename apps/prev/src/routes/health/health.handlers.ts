import type { AppRouteHandler } from "@/lib/types";
import { successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { CheckAPIHealthRoute } from "./health.routes";

export const checkAPIHealth: AppRouteHandler<CheckAPIHealthRoute> = async (
  c,
) => {
  return c.json(
    successResponse({ status: "ok" }, "API is healthy"),
    HttpStatusCodes.OK,
  );
};
