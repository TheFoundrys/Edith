import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCourseMcqPaper,
  displayQuestionsForPaper,
  scorePaperAnswers,
} from "../lib/assessments/course-mcq-paper";
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
  {
    id: "q3",
    prompt: "5+5?",
    options: ["8", "10", "12"],
    correctIndex: 1,
  },
];

test("buildCourseMcqPaper limits and randomizes per attempt", () => {
  const a = buildCourseMcqPaper(bank, {
    attemptId: "attempt-a",
    questionCount: 2,
    shuffleOptions: true,
  });
  const b = buildCourseMcqPaper(bank, {
    attemptId: "attempt-b",
    questionCount: 2,
    shuffleOptions: true,
  });
  assert.equal(a.questionIds.length, 2);
  assert.notDeepEqual(a, b);
  assert.deepEqual(
    buildCourseMcqPaper(bank, {
      attemptId: "attempt-a",
      questionCount: 2,
      shuffleOptions: true,
    }),
    a,
  );
});

test("display and score respect shuffled options", () => {
  const paper = buildCourseMcqPaper(bank, {
    attemptId: "score-test",
    questionCount: 3,
    shuffleOptions: true,
  });
  const displayed = displayQuestionsForPaper(bank, paper);
  assert.equal(displayed.length, 3);

  const answers: Record<string, number> = {};
  for (const question of displayed) {
    const bankQ = bank.find((q) => q.id === question.id)!;
    const correctText = bankQ.options[bankQ.correctIndex];
    answers[question.id] = question.options.indexOf(correctText);
  }
  const result = scorePaperAnswers(bank, paper, answers, 70);
  assert.equal(result.correct, 3);
  assert.equal(result.passed, true);
});
