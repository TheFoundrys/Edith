import test from "node:test";
import assert from "node:assert/strict";
import {
  APTITUDE_QUESTIONS,
  QUANTITATIVE_QUESTIONS,
  PSYCHE_QUESTIONS,
  buildPersonalityReport,
  isPersonalityProfileProgram,
  personalityProgress,
  scoreMcqBattery,
  scorePsyche,
  catalogHrefForProgram,
} from "../lib/assessments/personality-profile";
import {
  catalogDurationKey,
  catalogExperienceLabel,
  catalogMode,
} from "../lib/programs/catalog-meta";

test("personality SKU is recognised for any-level direct enroll", () => {
  assert.equal(
    isPersonalityProfileProgram({ slug: "edith-personality-profile" }),
    true,
  );
  assert.equal(
    isPersonalityProfileProgram({ domainSlug: "assessments" }),
    true,
  );
  assert.equal(isPersonalityProfileProgram({ sku: "ASSESS 001" }), true);
  assert.equal(
    isPersonalityProfileProgram({ slug: "ygp-applied-ai-genai" }),
    false,
  );
  assert.equal(
    catalogHrefForProgram({ slug: "edith-personality-profile" }),
    "/personality-profile",
  );
  assert.equal(
    catalogHrefForProgram({ slug: "ygp-applied-ai-genai" }),
    "/courses/ygp-applied-ai-genai",
  );
});

test("aptitude and quantitative batteries score by correct index", () => {
  const aptitudeAll = Object.fromEntries(
    APTITUDE_QUESTIONS.map((q) => [q.id, q.correctIndex]),
  );
  const aptitude = scoreMcqBattery(APTITUDE_QUESTIONS, aptitudeAll);
  assert.equal(aptitude.score, APTITUDE_QUESTIONS.length);
  assert.equal(aptitude.band, "Exceptional");

  const quantitativeNone = Object.fromEntries(
    QUANTITATIVE_QUESTIONS.map((q) => [
      q.id,
      (q.correctIndex + 1) % q.options.length,
    ]),
  );
  const quantitative = scoreMcqBattery(QUANTITATIVE_QUESTIONS, quantitativeNone);
  assert.equal(quantitative.score, 0);
  assert.equal(quantitative.band, "Developing");
});

test("psyche scoring treats Likert polarity and builds a report", () => {
  const psycheAnswers = Object.fromEntries(
    PSYCHE_QUESTIONS.map((q) => [q.id, q.polarity === 1 ? 3 : 0]),
  );
  const psyche = scorePsyche(psycheAnswers);
  assert.ok(psyche.drive >= 2.5);
  assert.ok(psyche.structure >= 2.5);
  assert.ok(psyche.people >= 2.5);
  assert.ok(psyche.risk >= 2.5);

  const responses = {
    aptitude: Object.fromEntries(
      APTITUDE_QUESTIONS.map((q) => [q.id, q.correctIndex]),
    ),
    quantitative: Object.fromEntries(
      QUANTITATIVE_QUESTIONS.map((q) => [q.id, q.correctIndex]),
    ),
    psyche: psycheAnswers,
  };
  const report = buildPersonalityReport(responses);
  assert.ok(report.insights.length >= 3);
  assert.ok(report.recommendations.length >= 1);
  assert.equal(personalityProgress(responses).done, 3);
  assert.equal(personalityProgress(responses).pct, 100);
});

test("catalog meta treats the 90-minute assessment as a self-paced session", () => {
  const program = {
    slug: "edith-personality-profile",
    category: "CERTIFICATION" as const,
    degreeLevel: "CERTIFICATE" as const,
    eligibilitySummary:
      "Experience is not mandatory. Suitable for any career stage.",
    campus: null,
    duration: "90 Minutes",
  };
  assert.equal(catalogMode(program), "Online · Self-paced");
  assert.equal(catalogDurationKey(program), "session");
  assert.equal(catalogExperienceLabel(program), "Not mandatory");
});
