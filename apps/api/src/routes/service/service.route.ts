import crypto from "node:crypto";

import { validator } from "hono-openapi";
import { z } from "zod";

import {
  ServiceInsertSchema,
  ServiceTokenInsertSchema,
} from "@repo/db/validators/service.validator";

import { createRouter } from "@/app";
import { decrypt, encrypt, hashToken } from "@/lib/encryption";
import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse, stripHyphens, successResponse } from "@/lib/utils";
import { validationHook } from "@/middleware/validation-hook";
import {
  createService,
  createServiceToken,
  deleteService,
  deleteServiceToken,
  getServices,
  getSingleService,
  getSingleServiceToken,
  updateService,
  updateServiceToken,
} from "@/queries/service-queries";

import {
  createServiceDoc,
  createServiceTokenDoc,
  deleteServiceDoc,
  deleteServiceTokenDoc,
  getServiceDoc,
  getServicesDoc,
  updateServiceDoc,
  updateServiceTokenDoc,
} from "./service.docs";

const serviceRouter = createRouter();

// non-reversible masking of token
const maskTokenPreview = (token: string): string => {
  const visibleLength = 4;
  const visiblePart = token.slice(-visibleLength);
  return `${"*".repeat(Math.max(0, token.length - visibleLength))}${visiblePart}`;
};

// after creation, API responses provide metadata + masked tokens only.
// We keep encrypted token at rest for compatibility, but never re-emit plaintext tokens
// because repeated secret retrieval materially increases leak risk in self-hosted setups.
const toPublicToken = (tokenRow: {
  id: string;
  serviceId: string;
  name: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  encryptedToken: string;
}) => {
  const decrypted = decrypt(tokenRow.encryptedToken);

  return {
    id: tokenRow.id,
    serviceId: tokenRow.serviceId,
    name: tokenRow.name,
    lastUsedAt: tokenRow.lastUsedAt,
    createdAt: tokenRow.createdAt,
    updatedAt: tokenRow.updatedAt,
    tokenPreview: maskTokenPreview(decrypted),
  };
};

// Get all services
serviceRouter.get("/", getServicesDoc, async (c) => {
  const services = await getServices();

  return c.json(
    successResponse(services, "Services retrieved successfully"),
    HttpStatusCodes.OK,
  );
});

// Create service
serviceRouter.post(
  "/",
  createServiceDoc,
  validator("json", ServiceInsertSchema, validationHook),
  async (c) => {
    const { name } = c.req.valid("json");

    const newService = await createService(name);

    return c.json(
      successResponse(newService, "Service created successfully"),
      HttpStatusCodes.CREATED,
    );
  },
);

// Get single service
serviceRouter.get(
  "/:id",
  getServiceDoc,
  validator("param", z.object({ id: z.uuid() }), validationHook),
  async (c) => {
    const serviceId = c.req.valid("param").id;

    const service = await getSingleService(serviceId);

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

// Update service
serviceRouter.patch(
  "/:id",
  updateServiceDoc,
  validator("param", z.object({ id: z.uuid() }), validationHook),
  validator("json", ServiceInsertSchema, validationHook),
  async (c) => {
    const serviceId = c.req.valid("param").id;
    const { name } = c.req.valid("json");

    // Get service
    const service = await getSingleService(serviceId);

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

    // Return success if the name didn't change
    if (name === service.name) {
      return c.json(
        successResponse(
          serviceWithDecryptedTokens,
          "Service updated successfully",
        ),
        HttpStatusCodes.OK,
      );
    }

    // Update service name
    const updatedService = await updateService({
      name,
      serviceId,
    });

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

// Delete service
serviceRouter.delete(
  "/:id",
  deleteServiceDoc,
  validator("param", z.object({ id: z.uuid() }), validationHook),
  async (c) => {
    const serviceId = c.req.valid("param").id;

    // Get service
    const service = await getSingleService(serviceId);

    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const deletedService = await deleteService({
      serviceId,
    });

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

// Create service token
serviceRouter.post(
  "/:id/tokens",
  createServiceTokenDoc,
  validator("param", z.object({ id: z.uuid() }), validationHook),
  validator("json", ServiceTokenInsertSchema, validationHook),
  async (c) => {
    const serviceId = c.req.valid("param").id;
    const { name } = c.req.valid("json");

    const service = await getSingleService(serviceId);

    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Generate random service token string
    const serviceTokenStr = stripHyphens(crypto.randomUUID());
    const encryptedServiceTokenStr = encrypt(serviceTokenStr);
    const hashedServiceTokenStr = hashToken(serviceTokenStr);

    // Create new service token
    const {
      encryptedToken: _et,
      hashedToken: _ht,
      ...newServiceToken
    } = await createServiceToken({
      encryptedToken: encryptedServiceTokenStr,
      hashedToken: hashedServiceTokenStr,
      name,
      serviceId,
    });

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

// Update service token
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

    // Get service
    const service = await getSingleService(serviceId);

    if (!service) {
      return c.json(
        errorResponse("SERVICE_NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Get token
    const encryptedServiceToken = await getSingleServiceToken(
      tokenId,
      serviceId,
    );

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

    // Update service token name
    const {
      encryptedToken: updatedEncryptedToken,
      hashedToken: _h3,
      ...updatedServiceToken
    } = await updateServiceToken({
      name,
      tokenId,
    });

    // masked tokens are returned instead of plaintext tokens
    const updatedDecryptedServiceToken = {
      ...updatedServiceToken,
      tokenPreview: maskTokenPreview(decrypt(updatedEncryptedToken)),
    };

    return c.json(
      successResponse(
        updatedDecryptedServiceToken,
        "Service token updated successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

// Delete service token
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

    // Get service
    const service = await getSingleService(serviceId);

    if (!service) {
      return c.json(
        errorResponse("SERVICE_NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Get token
    const serviceToken = await getSingleServiceToken(tokenId, serviceId);

    if (!serviceToken) {
      return c.json(
        errorResponse("TOKEN_NOT_FOUND", "Token not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Delete service token
    const deletedServiceToken = await deleteServiceToken({
      serviceId,
      tokenId,
    });

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

export default serviceRouter;
