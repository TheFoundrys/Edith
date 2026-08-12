import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const DOCUMENT_TYPES = new Set([
  ...IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export type StoredUpload = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

function toUrlPath(storagePath: string) {
  return storagePath.split(path.sep).join("/");
}

async function writeUpload(
  file: File,
  kind: "public" | "private",
): Promise<StoredUpload> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const relative = path.join(kind, randomUUID(), safeName);
  const absolute = path.join(UPLOAD_ROOT, relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
  return {
    storagePath: relative,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: bytes.length,
  };
}

/** @deprecated Prefer saveProgramImage / saveApplicationDocument */
export async function saveUpload(file: File) {
  return writeUpload(file, "private");
}

export async function saveProgramImage(
  file: File,
): Promise<{ imageUrl: string } | { error: string }> {
  const mimeType = file.type || "";
  if (!IMAGE_TYPES.has(mimeType)) {
    return { error: "Image must be JPEG, PNG, WebP, or GIF." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image must be 5 MB or smaller." };
  }

  const stored = await writeUpload(file, "public");
  return {
    imageUrl: `/api/uploads/${toUrlPath(stored.storagePath)}`,
  };
}

export async function saveApplicationDocument(
  file: File,
): Promise<StoredUpload | { error: string }> {
  const mimeType = file.type || "";
  if (!DOCUMENT_TYPES.has(mimeType)) {
    return {
      error: "Document must be PDF, Word, or an image (JPEG, PNG, WebP, GIF).",
    };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: "Document must be 10 MB or smaller." };
  }
  if (file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  return writeUpload(file, "private");
}

export function resolveUploadPath(relativeParts: string[]) {
  const relative = relativeParts.join("/");
  if (!relative || relative.includes("..") || path.isAbsolute(relative)) {
    return null;
  }

  const absolute = path.resolve(UPLOAD_ROOT, relative);
  const root = path.resolve(UPLOAD_ROOT) + path.sep;
  if (absolute !== path.resolve(UPLOAD_ROOT) && !absolute.startsWith(root)) {
    return null;
  }

  const kind = relativeParts[0] === "public" || relativeParts[0] === "private"
    ? relativeParts[0]
    : "private";

  return { relative, absolute, kind: kind as "public" | "private" };
}
