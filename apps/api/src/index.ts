import { createApp } from "@/app";
import dashboard from "@/routes/dashboard/dashboard.route";
import health from "@/routes/health/health.route";
import ingest from "@/routes/ingest/ingest.route";
import serviceRouter from "@/routes/service/service.route";

const app = createApp();

app.route("/api/health", health);
app.route("/api/ingest", ingest);
app.route("/api/services", serviceRouter);
app.route("/api/dashboard", dashboard);

export default {
  port: 8000,
  fetch: app.fetch,
};
