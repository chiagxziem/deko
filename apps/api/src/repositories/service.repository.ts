import { and, db, eq } from "@repo/db";
import type { Service, ServiceToken } from "@repo/db/schemas/service.schema";
import { service, serviceToken } from "@repo/db/schemas/service.schema";

import { hashToken } from "@/lib/encryption";

export type ServiceWithTokens = Service & {
  tokens: ServiceToken[];
};

/** Contract for service data access */
export interface IServiceRepository {
  getServices(): Promise<Service[]>;
  createService(name: string, slug: string): Promise<Service>;
  getSingleService(serviceId: string): Promise<ServiceWithTokens | undefined>;
  updateService(
    serviceId: string,
    name: string,
  ): Promise<ServiceWithTokens | undefined>;
  deleteService(serviceId: string): Promise<Service | undefined>;
  createServiceToken(
    encryptedToken: string,
    hashedToken: string,
    name: string,
    serviceId: string,
  ): Promise<ServiceToken>;
  getSingleServiceToken(
    tokenId: string,
    serviceId: string,
  ): Promise<ServiceToken | undefined>;
  updateServiceToken(
    name: string,
    tokenId: string,
  ): Promise<ServiceToken | undefined>;
  deleteServiceToken(
    tokenId: string,
    serviceId: string,
  ): Promise<ServiceToken | undefined>;
  getServiceByToken(token: string): Promise<Service | undefined>;
  touchServiceTokenLastUsed(token: string): Promise<void>;
  rotateServiceToken(
    tokenId: string,
    serviceId: string,
    newEncryptedToken: string,
    newHashedToken: string,
  ): Promise<ServiceToken | undefined>;
}

/**
 * This implements the IServiceRepository interface using direct DB queries.
 * */
export class ServiceRepository implements IServiceRepository {
  /** Fetches all services without token data. */
  async getServices() {
    return db.query.service.findMany();
  }

  /**
   * Creates a service with a given name and an already-computed slug.
   * The slug to be passed must be unique as this method does not enforce uniqueness itself.
   */
  async createService(name: string, slug: string) {
    const [newService] = await db
      .insert(service)
      .values({
        name,
        slug,
      })
      .returning();

    return newService;
  }

  /**
   * Retrieves a single service by ID, including its associated tokens.
   * If the service does not exist, returns `undefined`.
   * Note: token plaintext is never returned; tokens are included for metadata
   * purposes and should be masked by callers.
   */
  async getSingleService(serviceId: string) {
    return db.query.service.findFirst({
      where: (s) => eq(s.id, serviceId),
      with: {
        tokens: true,
      },
    });
  }

  /**
   * Updates a service given its ID and a new name, and returns the updated
   * service with tokens. The token should be masked by callers.
   * If the service does not exist, returns `undefined`.
   */
  async updateService(serviceId: string, name: string) {
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
  }

  /**
   * Deletes a service given its ID and returns the deleted service.
   * If the service does not exist, returns `undefined`.
   */
  async deleteService(serviceId: string) {
    const [deletedService] = await db
      .delete(service)
      .where(eq(service.id, serviceId))
      .returning();

    if (!deletedService) {
      return undefined;
    }

    return deletedService;
  }

  /**
   * Creates a service token with the given encrypted token, hashed token, name,
   * and associated service ID.
   */
  async createServiceToken(
    encryptedToken: string,
    hashedToken: string,
    name: string,
    serviceId: string,
  ) {
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
  }

  /**
   * Retrieves a single service token by ID and associated service ID.
   * If the token does not exist, returns `undefined`.
   */
  async getSingleServiceToken(tokenId: string, serviceId: string) {
    return await db.query.serviceToken.findFirst({
      where: (st) => and(eq(st.serviceId, serviceId), eq(st.id, tokenId)),
    });
  }

  /**
   * Updates a service token's name by ID.
   */
  async updateServiceToken(name: string, tokenId: string) {
    const [updatedServiceToken] = await db
      .update(serviceToken)
      .set({
        name,
      })
      .where(eq(serviceToken.id, tokenId))
      .returning();

    return updatedServiceToken;
  }

  /**
   * Deletes a service token by ID and associalted service ID.
   * If the token does not exist, returns `undefined`.
   */
  async deleteServiceToken(tokenId: string, serviceId: string) {
    const [deletedServiceToken] = await db
      .delete(serviceToken)
      .where(
        and(
          eq(serviceToken.id, tokenId),
          eq(serviceToken.serviceId, serviceId),
        ),
      )
      .returning();

    if (!deletedServiceToken) {
      return undefined;
    }

    return deletedServiceToken;
  }

  /**
   * Retrieves a service by plaintext token using hashed-token lookup.
   * If no matching token exists, returns `undefined`.
   */
  async getServiceByToken(token: string) {
    const hashedToken = hashToken(token);

    const singleServiceToken = await db.query.serviceToken.findFirst({
      where: (st) => eq(st.hashedToken, hashedToken),
      with: {
        service: true,
      },
    });

    return singleServiceToken?.service;
  }

  /**
   * Updates a service token's lastUsedAt by plaintext token.
   */
  async touchServiceTokenLastUsed(token: string) {
    const hashedToken = hashToken(token);

    await db
      .update(serviceToken)
      .set({
        lastUsedAt: new Date(),
      })
      .where(eq(serviceToken.hashedToken, hashedToken));
  }

  /**
   * Rotates a service token by replacing its encrypted and hashed secret
   * in-place. The token's ID, name, and metadata are preserved.
   * Returns the updated token row, or undefined if not found.
   */
  async rotateServiceToken(
    tokenId: string,
    serviceId: string,
    newEncryptedToken: string,
    newHashedToken: string,
  ) {
    const [rotatedToken] = await db
      .update(serviceToken)
      .set({
        encryptedToken: newEncryptedToken,
        hashedToken: newHashedToken,
      })
      .where(
        and(
          eq(serviceToken.id, tokenId),
          eq(serviceToken.serviceId, serviceId),
        ),
      )
      .returning();

    return rotatedToken;
  }
}
