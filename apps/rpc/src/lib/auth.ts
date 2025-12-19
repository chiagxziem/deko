import { db } from "@repo/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import env from "./env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
  },

  trustedOrigins: [env.BASE_URL, env.FRONTEND_URL],

  advanced: {
    database: { generateId: "uuid" },
    cookies: {
      session_token: {
        name: "logr_auth_session",
        attributes: {
          path: "/",
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          domain: env.NODE_ENV === "production" ? ".gozman.xyz" : undefined,
          expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000),
        },
      },
    },
  },

  experimental: {
    joins: true,
  },
});
