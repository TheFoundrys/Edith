import test from "node:test";
import assert from "node:assert/strict";
import { chunkText } from "../lib/rag/chunk";
import { cosineSimilarity, embedText } from "../lib/rag/embed";
import { extractResumeText } from "../lib/rag/resume-text";
import { jsonWithoutNul } from "../lib/db/pg-json";
import { groundedStudentGuidance } from "../lib/rag/advise";
import { personalityWizardStep } from "../lib/assessments/personality-kyc";
import { assignRanks, compositeExamScore, percentileFromRank } from "../lib/assessments/personality-rank";
import { pageHref, paginateItems, parsePage, resolvePageSize } from "../lib/pagination";

test("wizard waits on identity then resume then exam", () => {
  assert.equal(
    personalityWizardStep({
      identity: false,
      resume: false,
      exam: false,
    }),
    1,
  );
  assert.equal(
    personalityWizardStep({
      identity: true,
      resume: false,
      exam: false,
    }),
    2,
  );
  assert.equal(
    personalityWizardStep({
      identity: true,
      resume: true,
      exam: false,
    }),
    3,
  );
  assert.equal(
    personalityWizardStep({
      identity: true,
      resume: true,
      exam: true,
    }),
    3,
  );
});

test("hashed embeddings retrieve related text", () => {
  const query = embedText("python machine learning cybersecurity soc");
  const ai = embedText("Senior Python ML engineer building LLM tools");
  const cooking = embedText("pastry chef sourdough bakery recipes");
  assert.ok(cosineSimilarity(query, ai) > cosineSimilarity(query, cooking));
  assert.equal(chunkText("a".repeat(50), 20, 4).length > 1, true);
});

test("PDF extraction keeps resume words and drops embedded font metadata", () => {
  const text = extractResumeText(
    Buffer.from(
      "%PDF-1.4 /Type /Font /BaseFont /AAAAAA+Montserrat-Bold /Encoding /Identity-H " +
        "BT (Python\u0000 machine learning engineer) Tj ET",
      "latin1",
    ),
    "resume.pdf",
    "application/pdf",
  );
  assert.equal(text.includes("\u0000"), false);
  assert.equal(JSON.stringify({ resumeText: text }).includes("\\u0000"), false);
  assert.match(text.toLowerCase(), /python/);
  assert.doesNotMatch(text, /Montserrat|Identity|BaseFont|AAAAAA/i);
});

test("PDF extraction reads custom-font hex text via ToUnicode", () => {
  const text = extractResumeText(
    Buffer.from(
      "beginbfchar <0001> <0050> <0002> <0079> endbfchar BT <00010002> Tj ET",
      "latin1",
    ),
    "cv.pdf",
  );
  assert.match(text, /Py/);
});

test("jsonWithoutNul strips null bytes from nested resume metadata", () => {
  const cleaned = jsonWithoutNul({
    kyc: { resumeText: "Python\u0000 engineer" },
  });
  assert.equal(cleaned.kyc.resumeText, "Python engineer");
  assert.equal(JSON.stringify(cleaned).includes("\\u0000"), false);
});

test("composite rank prefers higher aptitude", () => {
  const a = compositeExamScore(90, 50, 1);
  const b = compositeExamScore(50, 90, 1);
  assert.ok(a > b);
  const ranked = assignRanks([
    {
      userId: "b",
      name: "B",
      aptitudePercent: 50,
      aptitudeBand: "Solid",
      quantitativePercent: 90,
      quantitativeBand: "Exceptional",
      psycheTop: "drive",
      psycheAvg: 2,
      completedAt: new Date("2026-01-02"),
    },
    {
      userId: "a",
      name: "A",
      aptitudePercent: 90,
      aptitudeBand: "Exceptional",
      quantitativePercent: 50,
      quantitativeBand: "Solid",
      psycheTop: "structure",
      psycheAvg: 2,
      completedAt: new Date("2026-01-01"),
    },
  ]);
  assert.equal(ranked[0]?.userId, "a");
  assert.equal(ranked[0]?.rank, 1);
  assert.equal(ranked[0]?.percentile, 100);
  assert.equal(ranked[1]?.percentile, 50);
  assert.equal(percentileFromRank(1, 10), 100);
  assert.equal(percentileFromRank(10, 10), 10);
});

test("grounded guidance cites scores and programmes", () => {
  const lines = groundedStudentGuidance({
    aptitudeBand: "Strong",
    quantitativeBand: "Solid",
    psycheTop: "drive",
    keywords: ["ai"],
    retrieved: [
      {
        source: "catalog",
        text: "Applied AI",
        score: 0.8,
        metadata: { slug: "pgp-applied-ai-genai", title: "Applied AI" },
      },
    ],
    recommendations: [
      { slug: "pgp-applied-ai-genai", reason: "AI resume" },
    ],
  });
  assert.ok(lines.some((line) => line.includes("Strong")));
  assert.ok(lines.some((line) => line.includes("pgp-applied-ai-genai")));
});

test("paginateItems clamps the page and slices the window", () => {
  const items = [1, 2, 3, 4, 5];
  const first = paginateItems(items, 1, 2);
  assert.deepEqual(first.items, [1, 2]);
  assert.equal(first.totalPages, 3);
  assert.equal(first.start, 0);
  const last = paginateItems(items, 99, 2);
  assert.deepEqual(last.items, [5]);
  assert.equal(last.page, 3);
  assert.equal(parsePage("0", 4), 1);
  assert.equal(parsePage("9", 4), 4);
  assert.equal(resolvePageSize("25"), 25);
  assert.equal(resolvePageSize("7"), 10);
  assert.equal(pageHref("/admin/members", 1, 10), "/admin/members");
  assert.equal(
    pageHref("/admin/members", 2, 25, { status: "active" }),
    "/admin/members?status=active&pageSize=25&page=2",
  );
});
