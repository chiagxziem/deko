import { createRouter } from "@/lib/create-app";
import * as ingestHandlers from "@/routes/ingest/ingest.handlers";
import * as ingestRoutes from "@/routes/ingest/ingest.routes";

const ingestRouter = createRouter();

ingestRouter.openapi(ingestRoutes.ingestLog, ingestHandlers.ingestLog);

export default ingestRouter;
