import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { McqGenerationStatus } from "@prisma/client";
import { readCourseMcqPaperFromMetadata } from "../lib/actions/course-mcq-session";
import { readLessonMcqPaper } from "../lib/actions/lesson-mcq-session";
import {
  buildCourseMcqPaper,
  displayQuestionsForPaper,
  reviewQuestionsForPaper,
  scorePaperAnswers,
} from "../lib/assessments/course-mcq-paper";
import { resolveMcqStatusAfterImport } from "../lib/assessments/mcq-publish";
import type { McqQuestion } from "../lib/assessments/mcq-types";

const bank: McqQuestion[] = [
  {
    id: "q1",
    prompt: "2+2?",
    options: ["3", "4", "5"],
    correctIndex: 1,
  },
  {
    id: "q2",
    prompt: "Capital of France?",
    options: ["Berlin", "Paris", "Rome"],
    correctIndex: 1,
  },
];

describe("readCourseMcqPaperFromMetadata", () => {
  it("reads paper from attempt metadata", () => {
    const paper = buildCourseMcqPaper(bank, {
      attemptId: "attempt-1",
      questionCount: 2,
      shuffleOptions: true,
    });
    const read = readCourseMcqPaperFromMetadata({ paper });
    assert.deepEqual(read?.questionIds, paper.questionIds);
  });

  it("returns null for invalid metadata", () => {
    assert.equal(readCourseMcqPaperFromMetadata(null), null);
    assert.equal(readCourseMcqPaperFromMetadata({}), null);
  });
});

describe("readLessonMcqPaper", () => {
  it("reads paper stored on lesson attempt answers", () => {
    const paper = buildCourseMcqPaper(bank, {
      attemptId: "lesson-attempt-1",
      questionCount: 2,
      shuffleOptions: true,
    });
    const read = readLessonMcqPaper({ paper });
    assert.deepEqual(read?.questionIds, paper.questionIds);
  });

  it("returns null when answers payload is missing paper", () => {
    assert.equal(readLessonMcqPaper({ userAnswers: {} }), null);
  });
});

describe("MCQ session scoring round-trip", () => {
  it("scores answers against stored course paper metadata", () => {
    const paper = buildCourseMcqPaper(bank, {
      attemptId: "attempt-score",
      questionCount: 2,
      shuffleOptions: true,
    });
    const display = displayQuestionsForPaper(bank, paper);
    const answers: Record<string, number> = {};
    for (const question of display) {
      const bankQuestion = bank.find((q) => q.id === question.id)!;
      const correctText = bankQuestion.options[bankQuestion.correctIndex];
      answers[question.id] = question.options.indexOf(correctText);
    }

    const stored = readCourseMcqPaperFromMetadata({ paper });
    assert.ok(stored);
    const result = scorePaperAnswers(bank, stored, answers, 70);
    assert.equal(result.total, 2);
    assert.equal(result.correct, 2);
    assert.equal(result.passed, true);
  });
});

describe("reviewQuestionsForPaper", () => {
  it("marks selected vs correct displayed options", () => {
    const paper = buildCourseMcqPaper(bank, {
      attemptId: "review-1",
      questionCount: 2,
      shuffleOptions: true,
    });
    const display = displayQuestionsForPaper(bank, paper);
    const answers: Record<string, number> = {};
    const first = display[0]!;
    answers[first.id] = first.options.findIndex(
      (option) => option === bank.find((q) => q.id === first.id)!.options[
        bank.find((q) => q.id === first.id)!.correctIndex
      ],
    );
    const second = display[1]!;
    answers[second.id] = (second.options.findIndex(
      (option) => option === bank.find((q) => q.id === second.id)!.options[
        bank.find((q) => q.id === second.id)!.correctIndex
      ],
    ) + 1) % second.options.length;

    const review = reviewQuestionsForPaper(bank, paper, answers);
    assert.equal(review[0]?.isCorrect, true);
    assert.equal(review[1]?.isCorrect, false);
    assert.equal(review[0]?.options[review[0].correctIndex], "4");
  });
});

describe("resolveMcqStatusAfterImport", () => {
  it("keeps READY when appending to a published bank", () => {
    const result = resolveMcqStatusAfterImport({ wasReady: true, replace: false });
    assert.equal(result.status, McqGenerationStatus.READY);
    assert.equal(result.needsRepublish, false);
  });

  it("sets PENDING when replacing a published bank", () => {
    const result = resolveMcqStatusAfterImport({ wasReady: true, replace: true });
    assert.equal(result.status, McqGenerationStatus.PENDING);
    assert.equal(result.needsRepublish, true);
  });

  it("sets PENDING when importing into an unpublished bank", () => {
    const result = resolveMcqStatusAfterImport({ wasReady: false, replace: false });
    assert.equal(result.status, McqGenerationStatus.PENDING);
    assert.equal(result.needsRepublish, true);
  });
});
