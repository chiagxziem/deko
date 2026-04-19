import { createServerOnlyFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import "@tanstack/react-start/server-only";

import { env } from "./env";

export const $getLastServiceId = createServerOnlyFn(() => {
  const lastServiceId = getCookie("deko_last_service_id");
  if (!lastServiceId) return null;
  return lastServiceId;
});

export const $setLastServiceId = createServerOnlyFn((serviceId: string) => {
  setCookie("deko_last_service_id", serviceId, {
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
});
