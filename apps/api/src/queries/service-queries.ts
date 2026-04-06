import slugify from "slugify";

import { and, db, eq } from "@repo/db";
import { service, serviceToken } from "@repo/db/schemas/service.schema";

import { hashToken } from "@/lib/encryption";

/**
 * Fetches every service row.
 *
 * Why this exists:
 * - Provides the canonical list endpoint backing `/services`.
 * - Is also reused by slug-generation logic in `createService` to avoid
 *   duplicate slugs before insertion.
 *
 * Behavior notes:
 * - Returns raw service records without token joins.
 * - Ordering is database default unless callers sort downstream.
 */
export const getServices = async () => {
  const services = await db.query.service.findMany();
  return services;
};

/**
 * Resolves a service from a plaintext service token.
 *
 * Why this exists:
 * - Ingest authentication is token-based, so API handlers must map a provided
 *   token to its owning service quickly and safely.
 *
 * Security notes:
 * - Tokens are never looked up in plaintext at rest.
 * - The incoming token is hashed first, and only the deterministic hash is used
 *   for lookup against `service_token.hashed_token`.
 */
export const getServiceByToken = async (token: string) => {
  const hashedToken = hashToken(token);

  const singleServiceToken = await db.query.serviceToken.findFirst({
    where: (st) => eq(st.hashedToken, hashedToken),
    with: {
      service: true,
    },
  });

  return singleServiceToken?.service;
};

/**
 * Updates `lastUsedAt` for a token after successful authentication.
 *
 * Why this exists:
 * - Supports token lifecycle observability (stale token cleanup, operational
 *   audits, and "last seen" UI indicators).
 *
 * Behavior notes:
 * - Uses hashed-token lookup so plaintext secrets are never persisted or queried.
 * - Callers intentionally treat this as best-effort and non-blocking.
 */
export const touchServiceTokenLastUsed = async (token: string) => {
  const hashedToken = hashToken(token);

  await db
    .update(serviceToken)
    .set({
      lastUsedAt: new Date(),
    })
    .where(eq(serviceToken.hashedToken, hashedToken));
};

/**
 * Creates a new service with a unique slug derived from its name.
 *
 * Why this exists:
 * - Human-readable slugs are useful for dashboards and URLs.
 * - Slug uniqueness is enforced here by suffixing (`-1`, `-2`, ...) when needed.
 *
 * Behavior notes:
 * - Slug generation uses the current service list and retries until unique.
 * - Returns the inserted row from the database.
 */
export const createService = async (name: string) => {
  // Get user's services
  const services = await getServices();

  // Generate slug
  let slug = slugify(name, { lower: true, strict: true });
  let counter = 0;
  while (true) {
    const finalSlug = counter === 0 ? slug : `${slug}-${counter}`;
    const existingService = services.find((p) => p.slug === finalSlug);

    if (!existingService) {
      slug = finalSlug;
      break;
    }
    counter++;
  }

  // Create service
  const [newService] = await db
    .insert(service)
    .values({
      name,
      slug,
    })
    .returning();

  return newService;
};

/**
 * Fetches one service and eagerly loads its tokens.
 *
 * Why this exists:
 * - Route handlers for service detail and update screens need service metadata
 *   and token metadata in one call.
 *
 * Behavior notes:
 * - Returns `undefined` when the service is not found.
 * - Includes token rows; callers decide whether to return masked previews only.
 */
export const getSingleService = async (serviceId: string) => {
  const singleService = await db.query.service.findFirst({
    where: (s) => eq(s.id, serviceId),
    with: {
      tokens: true,
    },
  });

  return singleService;
};

/**
 * Updates a service's mutable properties and returns the refreshed service view.
 *
 * Why this exists:
 * - Route handlers need post-update state (including tokens) for immediate API
 *   responses without issuing separate read calls in the handler.
 *
 * Behavior notes:
 * - Performs update by `serviceId` and returns `undefined` if no row matched.
 * - Executes a follow-up read with token relation to return a complete payload.
 */
export const updateService = async ({
  name,
  serviceId,
}: {
  name: string;
  serviceId: string;
}) => {
  const [updatedService] = await db
    .update(service)
    .set({
      name,
    })
    .where(eq(service.id, serviceId))
    .returning();

  if (!updatedService) {
    return undefined;
  }

  const updatedServiceWithTokens = await db.query.service.findFirst({
    where: eq(service.id, serviceId),
    with: {
      tokens: true,
    },
  });

  return updatedServiceWithTokens;
};

/**
 * Deletes a service by ID.
 *
 * Why this exists:
 * - Supports explicit service deprovisioning from API/UI flows.
 *
 * Behavior notes:
 * - Returns deleted row metadata when successful.
 * - Returns `undefined` when nothing matched, allowing handlers to emit 404.
 */
export const deleteService = async ({ serviceId }: { serviceId: string }) => {
  const [deletedService] = await db
    .delete(service)
    .where(eq(service.id, serviceId))
    .returning();

  if (!deletedService) {
    return undefined;
  }

  return deletedService;
};

/**
 * Creates a new service token row.
 *
 * Why this exists:
 * - Token creation separates concerns: route generates plaintext token, encryption
 *   and hashing are done before this insert, and this query persists storage-safe
 *   representations only.
 *
 * Security notes:
 * - `encryptedToken` stores reversible ciphertext for server-side preview masking.
 * - `hashedToken` enables deterministic auth lookup without plaintext storage.
 */
export const createServiceToken = async ({
  encryptedToken,
  hashedToken,
  name,
  serviceId,
}: {
  encryptedToken: string;
  hashedToken: string;
  name: string;
  serviceId: string;
}) => {
  const [newServiceToken] = await db
    .insert(serviceToken)
    .values({
      name,
      encryptedToken,
      hashedToken,
      serviceId,
    })
    .returning();

  return newServiceToken;
};

/**
 * Fetches one token row scoped to a specific service.
 *
 * Why this exists:
 * - Prevents cross-service token access by requiring both `tokenId` and
 *   `serviceId` in the predicate.
 *
 * Behavior notes:
 * - Returns `undefined` when no scoped match exists.
 */
export const getSingleServiceToken = async (
  tokenId: string,
  serviceId: string,
) => {
  const singleServiceToken = await db.query.serviceToken.findFirst({
    where: (st) => and(eq(st.serviceId, serviceId), eq(st.id, tokenId)),
  });

  return singleServiceToken;
};

/**
 * Updates mutable token metadata (currently name only).
 *
 * Why this exists:
 * - Allows teams to relabel tokens without rotating secrets.
 *
 * Behavior notes:
 * - Uses token ID as update key.
 * - Returns the updated row for immediate API response shaping.
 */
export const updateServiceToken = async ({
  name,
  tokenId,
}: {
  name: string;
  tokenId: string;
}) => {
  const [updatedServiceToken] = await db
    .update(serviceToken)
    .set({
      name,
    })
    .where(eq(serviceToken.id, tokenId))
    .returning();

  return updatedServiceToken;
};

/**
 * Deletes a token row scoped to a specific service.
 *
 * Why this exists:
 * - Route handlers must ensure token deletion cannot cross service boundaries.
 *
 * Behavior notes:
 * - Predicate includes both token ID and service ID.
 * - Returns deleted row or `undefined` so handlers can emit idempotent 404 paths.
 */
export const deleteServiceToken = async ({
  serviceId,
  tokenId,
}: {
  serviceId: string;
  tokenId: string;
}) => {
  const [deletedServiceToken] = await db
    .delete(serviceToken)
    .where(
      and(eq(serviceToken.id, tokenId), eq(serviceToken.serviceId, serviceId)),
    )
    .returning();

  if (!deletedServiceToken) {
    return undefined;
  }

  return deletedServiceToken;
};
