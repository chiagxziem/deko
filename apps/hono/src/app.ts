/** biome-ignore-all assist/source/organizeImports: needed */

import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth";
import env from "./lib/env";
import emojiFavicon from "./middleware/emoji-favicon";

import { secureHeaders } from "hono/secure-headers";
import errorHandler from "./middleware/error-handler";
import notFoundRoute from "./middleware/not-found-route";
import type { AppEnv } from "./types";

export const createRouter = () => {
  return new Hono<AppEnv>({ strict: false });
};

export const createApp = () => {
  const app = createRouter().basePath("/api");

  // CORS + Security
  app.use("/*", cors({ origin: env.FRONTEND_URL, credentials: true })).use(
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

  // Auth
  app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

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
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        servers: [{ url: `${env.BASE_URL}` }],
      },
    }),
  );

  // Scalar
  app.get(
    "/reference",
    Scalar({
      url: "/api/doc",
      authentication: {
        preferredSecurityScheme: "bearerAuth",
        securitySchemes: {
          bearerAuth: { token: "" },
        },
      },
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
