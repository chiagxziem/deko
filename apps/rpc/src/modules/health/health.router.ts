import { implement } from "@orpc/server";

import { successResponse } from "../../lib/utils";
import healthContract from "./health.contract";

const healthRouter = implement(healthContract);

const checkHealth = healthRouter.checkHealth.handler(() => {
  return successResponse({ status: "ok" }, "API is healthy");
});

export default { checkHealth };
