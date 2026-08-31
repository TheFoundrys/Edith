import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const PREFIX = "enc:v1";

function encryptionKey() {
  const secret = process.env.AI_CONFIG_ENCRYPTION_KEY?.trim();
  if (!secret) {
    throw new Error("AI_CONFIG_ENCRYPTION_KEY is not configured.");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptConfig(config: Record<string, string>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(config), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptConfig(value: string): Record<string, string> {
  if (!value.startsWith(`${PREFIX}:`)) {
    // Legacy rows are readable until the next settings save re-encrypts them.
    return JSON.parse(value) as Record<string, string>;
  }
  const [, , ivValue, tagValue, ciphertextValue] = value.split(":");
  if (!ivValue || !tagValue || !ciphertextValue) {
    throw new Error("Encrypted AI configuration is malformed.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plaintext) as Record<string, string>;
}
