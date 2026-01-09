import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { openAPIRouteHandler } from "hono-openapi";

import env from "@/lib/env";
import emojiFavicon from "@/middleware/emoji-favicon";
import errorHandler from "@/middleware/error-handler";
import notFoundRoute from "@/middleware/not-found-route";
import type { AppEnv } from "@/types";

export const createRouter = () => {
  return new Hono<AppEnv>({ strict: false });
};

export const createApp = () => {
  const app = createRouter().basePath("/api");

  // CORS
  app.use("/*", cors({ origin: env.WEB_URL, credentials: true }));

  // Security
  app.use(
    "*",
    secureHeaders({
      xFrameOptions: "DENY",
      xXssProtection: "1",
      strictTransportSecurity:
        env.NODE_ENV === "production"
          ? "max-age=31536000; includeSubDomains"
          : false,
      referrerPolicy: "strict-origin-when-cross-origin",
    }),
  );

  // Middleware for compressing the response body, logging requests and setting up the emoji favicon
  app.use(compress());
  app.use(logger());
  app.use(emojiFavicon("🪵"));

  // OpenAPI
  app.get(
    "/doc",
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: "Logr API",
          description: "The API for an API logging app.",
          version: "0.0.1",
        },
        servers: [{ url: `${env.API_URL}` }],
      },
    }),
  );

  // Scalar
  app.get(
    "/reference",
    Scalar({
      url: "/api/doc",
      persistAuth: true,
      pageTitle: "Logr API",
      theme: "saturn",
      hideModels: true,
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "axios",
      },
    }),
  );

  // Errors
  app.notFound(notFoundRoute);
  app.onError(errorHandler);

  return app;
};
