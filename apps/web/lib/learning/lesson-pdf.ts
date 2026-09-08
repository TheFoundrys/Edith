export function lessonPdfFileName(storagePath: string) {
  const segment = storagePath.split("/").pop() ?? "reading.pdf";
  return decodeURIComponent(segment) || "reading.pdf";
}
