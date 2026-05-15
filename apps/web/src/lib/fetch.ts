import { createFetch } from "@better-fetch/fetch";
import "@tanstack/react-start/server-only";

import { errorResSchema } from "@/lib/schemas";

import { env } from "./env";

const baseURL = `${env.API_URL}/api`;
const FETCH_TIMEOUT_MS = 90_000;

export const $fetch = createFetch({
  baseURL,
  credentials: "include",
  errorSchema: errorResSchema,
  timeout: FETCH_TIMEOUT_MS,
});

export const $fetchAndThrow = createFetch({
  baseURL,
  throw: true,
  credentials: "include",
  errorSchema: errorResSchema,
  timeout: FETCH_TIMEOUT_MS,
});

export const $fetchAndRetry = createFetch({
  baseURL,
  retry: {
    type: "linear",
    attempts: 2,
    delay: 500,
  },
  credentials: "include",
  errorSchema: errorResSchema,
  timeout: FETCH_TIMEOUT_MS,
});
