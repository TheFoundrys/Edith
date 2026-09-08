import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { uploadUrl } from "@/lib/urls";

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
const MAX_LESSON_PDF_BYTES = 25 * 1024 * 1024;

export type StoredUpload = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

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
    imageUrl: uploadUrl(stored.storagePath),
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

export async function saveLessonPdf(
  file: File,
): Promise<StoredUpload | { error: string }> {
  const mimeType = file.type || "";
  if (mimeType !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { error: "Upload a PDF file." };
  }
  if (file.size > MAX_LESSON_PDF_BYTES) {
    return { error: "PDF must be 25 MB or smaller." };
  }
  if (file.size === 0) {
    return { error: "Choose a PDF to upload." };
  }
  return writeUpload(file, "private");
}

export async function readStoredUpload(storagePath: string) {
  const relative = storagePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const resolved = resolveUploadPath(relative.split("/"));
  if (!resolved) return null;
  try {
    return await readFile(resolved.absolute);
  } catch {
    return null;
  }
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
