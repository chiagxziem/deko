import createApp from "@/lib/create-app";
import configureOpenAPI from "@/lib/openapi";
import healthRouter from "@/routes/health/health.index";
import ingestRouter from "@/routes/ingest/ingest.index";
import projectsRouter from "@/routes/projects/projects.index";

const app = createApp();

const routers = [healthRouter, ingestRouter, projectsRouter];

configureOpenAPI(app);

routers.forEach((router) => {
  app.route("/api", router);
});

export default app;
