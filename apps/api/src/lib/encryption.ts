import crypto from "node:crypto";

import env from "./env";

// AES-256-GCM provides authenticated encryption: both confidentiality and integrity.
// Tampered ciphertext is rejected during decryption.
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const PREFIX = "gcm";

const getKey = () =>
  crypto.createHash("sha256").update(env.ENCRYPTION_KEY).digest();

export const encrypt = (text: string): string => {
  // Encryption format: gcm:<ivHex>:<authTagHex>:<cipherHex>
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decrypt = (text: string): string => {
  const textParts = text.split(":");
  const [_prefix, ivHex, authTagHex, encryptedHex] = textParts;

  if (_prefix !== PREFIX || !ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};

/**
 * Hash a token using SHA-256 for deterministic lookups.
 * Unlike encrypt(), this always produces the same output for the same input.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
