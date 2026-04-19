import slugify from "slugify";

import type { Service } from "@repo/db/schemas/service.schema";

import { decrypt } from "@/lib/encryption";

/**
 * Generates a unique slug for a service given existing service list.
 * If a collision occurs, numeric suffixes (-1, -2, ...) are appended
 * until the slug is unique.
 */
export const generateUniqueSlug = (
  name: string,
  existingServices: Service[],
): string => {
  let slug = slugify(name, { lower: true, strict: true });
  let counter = 0;

  while (true) {
    const finalSlug = counter === 0 ? slug : `${slug}-${counter}`;
    const existingService = existingServices.find((p) => p.slug === finalSlug);

    if (!existingService) {
      return finalSlug;
    }

    counter++;
  }
};

/**
 * Masks token preview by showing only last 4 characters.
 * Uses a short fixed mask so previews stay compact in the UI.
 */
export const maskTokenPreview = (token: string): string => {
  const prefix = "deko_sk_";
  const maskLength = 8;
  const visibleLength = 4;

  if (token.startsWith(prefix)) {
    const rest = token.slice(prefix.length);
    const visiblePart = rest.slice(-visibleLength);
    const maskedPart = "*".repeat(maskLength);
    return `${prefix}${maskedPart}${visiblePart}`;
  }

  const visiblePart = token.slice(-visibleLength);
  return `${"*".repeat(maskLength)}${visiblePart}`;
};

/**
 * Transforms encrypted token row into public API response shape.
 * Decrypts stored token to mask preview; never returns plaintext to client.
 */
export const toPublicToken = (tokenRow: {
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
