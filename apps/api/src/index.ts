import { createApp } from "@/app";
import health from "@/routes/health/health.route";
import ingest from "@/routes/ingest/ingest.route";
import service from "@/routes/service/service.route";

const app = createApp();

app.route("/health", health);
app.route("/ingest", ingest);
app.route("/services", service);

export default {
  port: 8000,
  fetch: app.fetch,
};
