import { createRouter } from "@/lib/create-app";
import * as healthHandlers from "@/routes/health/health.handlers";
import * as healthRoutes from "@/routes/health/health.routes";

const healthRouter = createRouter();

healthRouter.openapi(
  healthRoutes.checkAPIHealth,
  healthHandlers.checkAPIHealth,
);

export default healthRouter;
