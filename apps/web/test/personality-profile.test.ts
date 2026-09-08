import test from "node:test";
import assert from "node:assert/strict";
import {
  APTITUDE_QUESTIONS,
  LIKERT_OPTIONS,
  PERSONALITY_EXAM_QUESTION_COUNT,
  QUANTITATIVE_QUESTIONS,
  PSYCHE_QUESTIONS,
  questionsForExam,
  splitExamAnswers,
  buildPersonalityReport,
  isPersonalityProfileProgram,
  personalityProgress,
  resumeRecommendations,
  recommendedAssessExam,
  resumeSkillLabels,
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
  assert.equal(personalityProgress(responses).done, 90);
  assert.equal(personalityProgress(responses).total, 90);
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

test("each battery is a 30-question assignment", () => {
  assert.equal(APTITUDE_QUESTIONS.length, 30);
  assert.equal(QUANTITATIVE_QUESTIONS.length, 30);
  assert.equal(PSYCHE_QUESTIONS.length, 30);
  assert.equal(PERSONALITY_EXAM_QUESTION_COUNT, 90);
});

test("one exam paper is 90 questions and splits answers by battery", () => {
  const paperQuestions = questionsForExam(null);
  assert.equal(paperQuestions.length, 90);
  assert.equal(new Set(paperQuestions.map((q) => q.id)).size, 90);
  const psyche = paperQuestions.find((q) => q.battery === "psyche");
  assert.deepEqual(psyche?.options, [...LIKERT_OPTIONS]);

  const answers = Object.fromEntries(
    paperQuestions.map((q, index) => [q.id, index % 4]),
  );
  const split = splitExamAnswers(answers);
  assert.equal(Object.keys(split.aptitude ?? {}).length, 30);
  assert.equal(Object.keys(split.quantitative ?? {}).length, 30);
  assert.equal(Object.keys(split.psyche ?? {}).length, 30);
});

test("resume keywords influence programme recommendations", () => {
  const psycheAnswers = Object.fromEntries(
    PSYCHE_QUESTIONS.map((q) => [q.id, q.polarity === 1 ? 3 : 0]),
  );
  const responses = {
    aptitude: Object.fromEntries(
      APTITUDE_QUESTIONS.map((q) => [q.id, q.correctIndex]),
    ),
    quantitative: Object.fromEntries(
      QUANTITATIVE_QUESTIONS.map((q) => [q.id, q.correctIndex]),
    ),
    psyche: psycheAnswers,
  };
  const report = buildPersonalityReport(responses, {
    resumeKeywords: ["cyber"],
  });
  assert.ok(
    report.recommendations.some((item) => item.slug.includes("cyber")),
  );
});

test("resume-only recommendations land before the exam", () => {
  const recs = resumeRecommendations(["ai", "cyber", "unknown"]);
  assert.equal(recs[0]?.slug, "pgp-applied-ai-genai");
  assert.ok(recs.some((item) => item.slug.includes("cyber")));
  assert.equal(recs.length, 2);
  assert.deepEqual(resumeSkillLabels(["ai", "cyber"]), [
    "AI / machine learning",
    "cybersecurity",
  ]);
  const exam = recommendedAssessExam(["ai"]);
  assert.equal(exam.title, "Edith Personality Profile");
  assert.equal(exam.fee, "₹3,500 + GST");
  assert.match(exam.reason, /AI \/ machine learning/);
});
