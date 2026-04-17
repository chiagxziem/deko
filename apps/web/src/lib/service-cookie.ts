// Dummy services — replace with real API fetch when wiring
export type DummyService = {
  id: string;
  name: string;
  slug: string;
};

export const DUMMY_SERVICES: DummyService[] = [
  { id: "1", name: "Payments API", slug: "payments-api" },
  { id: "2", name: "User Service", slug: "user-service" },
  { id: "3", name: "Notifications", slug: "notifications" },
];

const COOKIE_KEY = "deko_last_service_id";

/** Read the last selected service ID from the cookie. Returns null if not set or SSR. */
export function getLastServiceId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Write the selected service ID to a long-lived cookie. */
export function setLastServiceId(id: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(id)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Resolve which service ID to use on app entry.
 * Reads the cookie, validates it against the provided services list,
 * and falls back to the first service.
 */
export function resolveDefaultServiceId(services: DummyService[]): string {
  if (services.length === 0) throw new Error("No services available");
  const lastId = getLastServiceId();
  const valid = services.find((s) => s.id === lastId);
  return valid ? valid.id : services[0].id;
}
