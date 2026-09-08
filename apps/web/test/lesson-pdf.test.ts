import assert from "node:assert/strict";
import test from "node:test";
import { lessonPdfFileName } from "../lib/learning/lesson-pdf";
import { activityTypeLabel } from "../lib/learning/standards";

test("PDF activities are labelled and named from the storage path", () => {
  assert.equal(activityTypeLabel("PDF_FILE"), "PDF");
  assert.equal(
    lessonPdfFileName("private/abc123/Threat_Landscape_Notes.pdf"),
    "Threat_Landscape_Notes.pdf",
  );
});
