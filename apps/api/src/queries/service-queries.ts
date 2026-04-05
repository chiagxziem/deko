import slugify from "slugify";

import { and, db, eq } from "@repo/db";
import { service, serviceToken } from "@repo/db/schemas/service.schema";

import { hashToken } from "@/lib/encryption";

/**
 * Get all services
 * @returns An array of services
 */
export const getServices = async () => {
  const services = await db.query.service.findMany();
  return services;
};

/**
 * Get a service by its token
 * @param token - The token of the service
 * @returns The service
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
 * Update last-used timestamp for a service token after successful token auth
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
 * Create a new service
 * @param name - Name of the service
 * @returns The created service
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
 * Get a single service
 * @param serviceId - The ID of the service
 * @returns The service with its tokens
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
 * Update a service
 * @param name - Name of the service
 * @param serviceId - The ID of the service
 * @returns The updated service with its tokens
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
 * Delete a service
 * @param serviceId - The ID of the service
 * @returns The deleted service
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
 * Create a new service token
 * @param encryptedToken - The encrypted token
 * @param hashedToken - The hashed token for lookups
 * @param name - The name of the token
 * @param serviceId - The ID of the service
 * @returns The created service token
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
 * Get a single service token
 * @param tokenId - The ID of the token
 * @param serviceId - The ID of the service
 * @returns The service token
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
 * Update a service token
 * @param name - The updated name
 * @param tokenId - The ID of the token
 * @returns The updated service token
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
 * Delete a service token
 * @param serviceId - The ID of the service
 * @param tokenId - The ID of the token
 * @returns The deleted service token
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
