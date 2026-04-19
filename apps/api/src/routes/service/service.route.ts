import crypto from "node:crypto";

import { validator } from "hono-openapi";
import { z } from "zod";

import {
  ServiceInsertSchema,
  ServiceTokenInsertSchema,
} from "@repo/db/validators/service.validator";

import { createRouter } from "@/app";
import { encrypt, hashToken } from "@/lib/encryption";
import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse, stripHyphens, successResponse } from "@/lib/utils";
import { validationHook } from "@/middleware/validation-hook";
import {
  ServiceRepository,
  type IServiceRepository,
} from "@/repositories/service.repository";
import { generateUniqueSlug, toPublicToken } from "@/services/service.service";

import {
  createServiceDoc,
  createServiceTokenDoc,
  deleteServiceDoc,
  deleteServiceTokenDoc,
  getServiceDoc,
  getServicesDoc,
  rotateServiceTokenDoc,
  updateServiceDoc,
  updateServiceTokenDoc,
} from "./service.docs";

type ServiceRouteDeps = {
  serviceRepository: IServiceRepository;
};

export const createServiceRouter = ({
  serviceRepository,
}: ServiceRouteDeps) => {
  const serviceRouter = createRouter();

  // ---------------------------------------------------------------------------
  // LIST SERVICES
  // Returns all services so the dashboard/service selector can render available
  // projects in one request.
  // ---------------------------------------------------------------------------
  serviceRouter.get("/", getServicesDoc, async (c) => {
    const services = await serviceRepository.getServices();
    return c.json(
      successResponse(services, "Services retrieved successfully"),
      HttpStatusCodes.OK,
    );
  });

  // ---------------------------------------------------------------------------
  // CREATE SERVICE
  // Creates a new service entity from a validated name.
  // ---------------------------------------------------------------------------
  serviceRouter.post(
    "/",
    createServiceDoc,
    validator("json", ServiceInsertSchema, validationHook),
    async (c) => {
      const { name } = c.req.valid("json");

      const existingServices = await serviceRepository.getServices();
      const slug = generateUniqueSlug(name, existingServices);

      const newService = await serviceRepository.createService(name, slug);

      return c.json(
        successResponse(newService, "Service created successfully"),
        HttpStatusCodes.CREATED,
      );
    },
  );

  // ---------------------------------------------------------------------------
  // GET SINGLE SERVICE
  // Retrieves one service and its token metadata.
  // Every token is masked to prevent token plaintext exposure.
  // ---------------------------------------------------------------------------
  serviceRouter.get(
    "/:id",
    getServiceDoc,
    validator("param", z.object({ id: z.uuid() }), validationHook),
    async (c) => {
      const serviceId = c.req.valid("param").id;

      const service = await serviceRepository.getSingleService(serviceId);

      if (!service) {
        return c.json(
          errorResponse("NOT_FOUND", "Service not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // masked tokens are returned instead of plaintext tokens
      // plaintext tokens are only shown once on creation
      const serviceTokens = service.tokens.map((pt) => toPublicToken(pt));

      const serviceWithDecryptedTokens = {
        ...service,
        tokens: serviceTokens,
      };

      return c.json(
        successResponse(
          serviceWithDecryptedTokens,
          "Service retrieved successfully",
        ),
        HttpStatusCodes.OK,
      );
    },
  );

  // ---------------------------------------------------------------------------
  // UPDATE SERVICE
  // Updates mutable service fields (currently `name`) and returns refreshed data.
  // All tokens returned are masked to prevent token plaintext exposure.
  // ---------------------------------------------------------------------------
  serviceRouter.patch(
    "/:id",
    updateServiceDoc,
    validator("param", z.object({ id: z.uuid() }), validationHook),
    validator("json", ServiceInsertSchema, validationHook),
    async (c) => {
      const serviceId = c.req.valid("param").id;
      const { name } = c.req.valid("json");

      const service = await serviceRepository.getSingleService(serviceId);

      if (!service) {
        return c.json(
          errorResponse("NOT_FOUND", "Service not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // masked tokens are returned instead of plaintext tokens
      const serviceTokens = service.tokens.map((pt) => toPublicToken(pt));

      const serviceWithDecryptedTokens = {
        ...service,
        tokens: serviceTokens,
      };

      // return success if the name didn't change
      if (name === service.name) {
        return c.json(
          successResponse(
            serviceWithDecryptedTokens,
            "Service updated successfully",
          ),
          HttpStatusCodes.OK,
        );
      }

      const updatedService = await serviceRepository.updateService(
        serviceId,
        name,
      );

      if (!updatedService) {
        return c.json(
          errorResponse("NOT_FOUND", "Service not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // masked tokens are returned instead of plaintext tokens
      const updatedServiceTokens = updatedService.tokens.map((pt) =>
        toPublicToken(pt),
      );

      const updatedServiceWithDecryptedTokens = {
        ...updatedService,
        tokens: updatedServiceTokens,
      };

      return c.json(
        successResponse(
          updatedServiceWithDecryptedTokens,
          "Service updated successfully",
        ),
        HttpStatusCodes.OK,
      );
    },
  );

  // ---------------------------------------------------------------------------
  // DELETE SERVICE
  // Removes a service record and associated resources.
  // ---------------------------------------------------------------------------
  serviceRouter.delete(
    "/:id",
    deleteServiceDoc,
    validator("param", z.object({ id: z.uuid() }), validationHook),
    async (c) => {
      const serviceId = c.req.valid("param").id;

      const service = await serviceRepository.getSingleService(serviceId);

      if (!service) {
        return c.json(
          errorResponse("NOT_FOUND", "Service not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const deletedService = await serviceRepository.deleteService(serviceId);

      if (!deletedService) {
        return c.json(
          errorResponse("NOT_FOUND", "Service not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      return c.json(
        successResponse({ status: "ok" }, "Service deleted successfully"),
        HttpStatusCodes.OK,
      );
    },
  );

  // ---------------------------------------------------------------------------
  // CREATE SERVICE TOKEN
  // Generates a new token for a service.
  // The created token is returned in plaintext only in this response.
  // All subsequent retrievals of this token will return only masked previews.
  // The created token is stored in encrypted form for preview masking and
  // hashed form for deterministic auth lookup.
  // ---------------------------------------------------------------------------
  serviceRouter.post(
    "/:id/tokens",
    createServiceTokenDoc,
    validator("param", z.object({ id: z.uuid() }), validationHook),
    validator("json", ServiceTokenInsertSchema, validationHook),
    async (c) => {
      const serviceId = c.req.valid("param").id;
      const { name } = c.req.valid("json");

      const service = await serviceRepository.getSingleService(serviceId);

      if (!service) {
        return c.json(
          errorResponse("NOT_FOUND", "Service not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Generate random service token string
      const serviceTokenStr = `deko_sk_${stripHyphens(crypto.randomUUID())}`;

      // create encrypted and hashed versions for storage
      const encryptedServiceTokenStr = encrypt(serviceTokenStr);
      const hashedServiceTokenStr = hashToken(serviceTokenStr);

      const {
        encryptedToken: _et,
        hashedToken: _ht,
        ...newServiceToken
      } = await serviceRepository.createServiceToken(
        encryptedServiceTokenStr,
        hashedServiceTokenStr,
        name,
        serviceId,
      );

      const newDecryptedServiceToken = {
        ...newServiceToken,
        token: serviceTokenStr,
      };

      return c.json(
        successResponse(
          newDecryptedServiceToken,
          "Service token created successfully",
        ),
        HttpStatusCodes.CREATED,
      );
    },
  );

  // ---------------------------------------------------------------------------
  // UPDATE SERVICE TOKEN
  // Updates mutable token metadata (currently only `name`) without rotating the
  // underlying token secret.
  // The updated token metadata is returned with a masked preview as the
  // plaintext token value is never returned after creation.
  // ---------------------------------------------------------------------------
  serviceRouter.patch(
    "/:serviceId/tokens/:tokenId",
    updateServiceTokenDoc,
    validator(
      "param",
      z.object({ serviceId: z.uuid(), tokenId: z.uuid() }),
      validationHook,
    ),
    validator("json", ServiceTokenInsertSchema, validationHook),
    async (c) => {
      const { serviceId, tokenId } = c.req.valid("param");
      const { name } = c.req.valid("json");

      const service = await serviceRepository.getSingleService(serviceId);
      if (!service) {
        return c.json(
          errorResponse("SERVICE_NOT_FOUND", "Service not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const encryptedServiceToken =
        await serviceRepository.getSingleServiceToken(tokenId, serviceId);

      if (!encryptedServiceToken) {
        return c.json(
          errorResponse("TOKEN_NOT_FOUND", "Token not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // masked tokens are returned instead of plaintext tokens
      const decryptedServiceToken = toPublicToken(encryptedServiceToken);

      // Return success if the name didn't change
      if (name === decryptedServiceToken.name) {
        return c.json(
          successResponse(
            decryptedServiceToken,
            "Service token updated successfully",
          ),
          HttpStatusCodes.OK,
        );
      }

      const updatedServiceToken = await serviceRepository.updateServiceToken(
        name,
        tokenId,
      );

      if (!updatedServiceToken) {
        return c.json(
          errorResponse("TOKEN_NOT_FOUND", "Token not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // masked tokens are returned instead of plaintext tokens
      const updatedDecryptedServiceToken = toPublicToken(updatedServiceToken);

      return c.json(
        successResponse(
          updatedDecryptedServiceToken,
          "Service token updated successfully",
        ),
        HttpStatusCodes.OK,
      );
    },
  );

  // ---------------------------------------------------------------------------
  // DELETE SERVICE TOKEN
  // Revokes a token by deleting it from the service.
  // ---------------------------------------------------------------------------
  serviceRouter.delete(
    "/:serviceId/tokens/:tokenId",
    deleteServiceTokenDoc,
    validator(
      "param",
      z.object({ serviceId: z.uuid(), tokenId: z.uuid() }),
      validationHook,
    ),
    async (c) => {
      const { serviceId, tokenId } = c.req.valid("param");

      const service = await serviceRepository.getSingleService(serviceId);

      if (!service) {
        return c.json(
          errorResponse("SERVICE_NOT_FOUND", "Service not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const serviceToken = await serviceRepository.getSingleServiceToken(
        tokenId,
        serviceId,
      );

      if (!serviceToken) {
        return c.json(
          errorResponse("TOKEN_NOT_FOUND", "Token not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Delete service token
      const deletedServiceToken = await serviceRepository.deleteServiceToken(
        tokenId,
        serviceId,
      );

      if (!deletedServiceToken) {
        return c.json(
          errorResponse("TOKEN_NOT_FOUND", "Token not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      return c.json(
        successResponse(
          {
            status: "ok",
          },
          "Service token deleted successfully",
        ),
        HttpStatusCodes.OK,
      );
    },
  );

  // ---------------------------------------------------------------------------
  // ROTATE SERVICE TOKEN
  // Replaces the underlying token secret in-place without changing the token's
  // ID, name, or history. The new plaintext is returned only in this response;
  // all subsequent reads return a masked preview.
  // ---------------------------------------------------------------------------
  serviceRouter.post(
    "/:serviceId/tokens/:tokenId/rotate",
    rotateServiceTokenDoc,
    validator(
      "param",
      z.object({ serviceId: z.uuid(), tokenId: z.uuid() }),
      validationHook,
    ),
    async (c) => {
      const { serviceId, tokenId } = c.req.valid("param");

      const service = await serviceRepository.getSingleService(serviceId);
      if (!service) {
        return c.json(
          errorResponse("SERVICE_NOT_FOUND", "Service not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const existingToken = await serviceRepository.getSingleServiceToken(
        tokenId,
        serviceId,
      );
      if (!existingToken) {
        return c.json(
          errorResponse("TOKEN_NOT_FOUND", "Token not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      const newTokenStr = `deko_sk_${stripHyphens(crypto.randomUUID())}`;
      const newEncryptedToken = encrypt(newTokenStr);
      const newHashedToken = hashToken(newTokenStr);

      const rotated = await serviceRepository.rotateServiceToken(
        tokenId,
        serviceId,
        newEncryptedToken,
        newHashedToken,
      );

      if (!rotated) {
        return c.json(
          errorResponse("TOKEN_NOT_FOUND", "Token not found"),
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Strip internal fields; expose new plaintext once (same pattern as create)
      const {
        encryptedToken: _et,
        hashedToken: _ht,
        ...rotatedToken
      } = rotated;

      return c.json(
        successResponse(
          { ...rotatedToken, token: newTokenStr },
          "Service token rotated successfully",
        ),
        HttpStatusCodes.OK,
      );
    },
  );

  return serviceRouter;
};

const serviceRouter = createServiceRouter({
  serviceRepository: new ServiceRepository(),
});

export default serviceRouter;
