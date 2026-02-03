import type { AppEnv } from "@/types";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import env from "@/lib/env";
import emojiFavicon from "@/middleware/emoji-favicon";
import errorHandler from "@/middleware/error-handler";
import notFoundRoute from "@/middleware/not-found-route";

export const createRouter = () => {
  return new Hono<AppEnv>({ strict: false });
};

export const createApp = () => {
  const app = createRouter();

  // CORS
  const corsOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : "*";

  app.use(
    "/*",
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  // Security Headers
  app.use(
    "*",
    secureHeaders({
      xFrameOptions: "DENY",
      xXssProtection: "1",
      strictTransportSecurity:
        env.NODE_ENV === "production" ? "max-age=31536000; includeSubDomains" : false,
      referrerPolicy: "strict-origin-when-cross-origin",
    }),
  );

  // Compressing the response body, log requests and set up the emoji favicon
  app.use(compress());
  app.use(logger());
  app.use(emojiFavicon("🪵"));

  // OpenAPI
  app.get(
    "/api/doc",
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: "Deko API",
          description: "The API for an API logging app.",
          version: "0.0.1",
        },
        servers: [{ url: env.API_URL }],
      },
    }),
  );

  // Scalar
  app.get(
    "/api/reference",
    Scalar({
      url: "/api/doc",
      persistAuth: true,
      pageTitle: "Deko API",
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
