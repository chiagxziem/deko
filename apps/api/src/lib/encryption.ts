import crypto from "node:crypto";

import env from "./env";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(env.ENCRYPTION_KEY),
    iv,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decrypt = (text: string): string => {
  const textParts = text.split(":");
  const ivHex = textParts.shift();
  if (!ivHex || textParts.length === 0) {
    throw new Error("Invalid encrypted text format: missing IV or content");
  }
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(env.ENCRYPTION_KEY),
    iv,
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
