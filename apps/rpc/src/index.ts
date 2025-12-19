import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import packageJson from "../../../package.json";
import { auth } from "./lib/auth";
import env from "./lib/env";
import { errorResponse } from "./lib/utils";
import emojiFavicon from "./middleware/emoji-favicon";
import errorHandler from "./middleware/error-handler";
import notFoundRoute from "./middleware/not-found-route";
import healthRouter from "./modules/health/health.router";

const router = {
  health: healthRouter,
};

const handler = new OpenAPIHandler(router, {
  customErrorResponseBodyEncoder(error) {
    console.log(error.toJSON());
    return {
      // defined: error.defined,
      ...errorResponse(error.code, error.message),
    };
  },
  plugins: [
    new OpenAPIReferencePlugin({
      docsProvider: "scalar",
      docsConfig: {
        authentication: {
          preferredSecurityScheme: "Bearer",
        },
        persistAuth: true,
        pageTitle: "Logr API",
        theme: "saturn",
        hideModels: true,
        defaultHttpClient: {
          targetKey: "js",
          clientKey: "axios",
        },
      },
      docsTitle: "Logr API",
      docsPath: "/reference",
      specPath: "/doc",
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        customErrorResponseBodySchema: (definedErrorDefinitions, _status) => {
          // biome-ignore lint/suspicious/noExplicitAny: required
          const result: Record<any, any> = {
            oneOf: [],
          };

          for (const [code, defaultMessage] of definedErrorDefinitions) {
            result.oneOf.push({
              type: "object",
              properties: {
                status: { type: "string", const: "error" },
                error: {
                  type: "object",
                  properties: {
                    code: { type: "string", const: code },
                    details: { type: "string", default: defaultMessage },
                  },
                  required: ["code", "details"],
                },
              },
              required: ["status", "error"],
            });
          }

          result.oneOf.push({
            type: "object",
            properties: {
              status: { type: "string", const: "error" },
              error: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  details: { type: "string" },
                },
                required: ["code", "details"],
              },
            },
            required: ["status", "error"],
          });

          return result;
        },
        info: {
          title: "Logr API",
          description: "The API for an API logging app.",
          version: packageJson.version,
        },
        servers: [{ url: "/api" }],
        components: {
          securitySchemes: {
            Bearer: {
              type: "http",
              scheme: "bearer",
            },
          },
        },
      },
    }),
  ],
});

const app = new Hono();

// CORS
app.use("/api/*", cors({ origin: env.FRONTEND_URL, credentials: true }));

// Security Headers
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

// Better Auth
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// ORPC
app.use("/api/*", async (c, next) => {
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: "/api",
    context: {
      headers: c.req.raw.headers,
    },
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

// Middleware for handling errors and not found routes
app.notFound(notFoundRoute);
app.onError(errorHandler);

export default app;
