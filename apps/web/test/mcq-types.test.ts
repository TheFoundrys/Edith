import assert from "node:assert/strict";
import test from "node:test";
import {
  parseMcqQuestions,
  scoreMcqAnswers,
} from "../lib/assessments/mcq-types";

test("parseMcqQuestions validates question shape", () => {
  const questions = parseMcqQuestions([
    {
      id: "q1",
      prompt: "2 + 2 = ?",
      options: ["3", "4", "5"],
      correctIndex: 1,
    },
    { prompt: "bad", options: ["only one"], correctIndex: 0 },
  ]);
  assert.equal(questions.length, 1);
  assert.equal(questions[0]?.prompt, "2 + 2 = ?");
});

test("scoreMcqAnswers counts correct answers", () => {
  const questions = parseMcqQuestions([
    {
      id: "q1",
      prompt: "A",
      options: ["x", "y"],
      correctIndex: 0,
    },
    {
      id: "q2",
      prompt: "B",
      options: ["x", "y"],
      correctIndex: 1,
    },
  ]);
  const result = scoreMcqAnswers(questions, { q1: 0, q2: 0 });
  assert.equal(result.correct, 1);
  assert.equal(result.total, 2);
  assert.equal(result.percentage, 50);
});
