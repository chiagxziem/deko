import createApp from "@/lib/create-app";
import configureOpenAPI from "./lib/openapi";

const app = createApp();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// const routers = [];

configureOpenAPI(app);

// routers.forEach((router) => {
//   app.route("/api", router);
// });

export default app;
