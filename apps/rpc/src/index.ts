import { createApp } from "./app";
import health from "./services/health/health.route";
import ingest from "./services/ingest/ingest.route";
import project from "./services/project/project.route";
import user from "./services/user/user.route";

const app = createApp();

const routes = app
  .route("/health", health)
  .route("/user", user)
  .route("/ingest", ingest)
  .route("/project", project);

export type AppType = typeof routes;
export default routes;
