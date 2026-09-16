import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  importMcqQuestionsFromJson,
  parseMcqImportPayload,
} from "../lib/assessments/mcq-import";
import type { McqQuestion } from "../lib/assessments/mcq-types";

describe("parseMcqImportPayload", () => {
  it("accepts a bare array", () => {
    const items = parseMcqImportPayload([
      { prompt: "A?", options: ["x", "y"], correctIndex: 0 },
    ]);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.prompt, "A?");
  });

  it("accepts a questions wrapper", () => {
    const items = parseMcqImportPayload({
      questions: [
        { question: "B?", options: ["1", "2"], correctAnswer: 1 },
      ],
    });
    assert.equal(items.length, 1);
    assert.equal(items[0]?.correctIndex, 1);
  });
});

describe("importMcqQuestionsFromJson", () => {
  const existing: McqQuestion[] = [
    {
      id: "q-existing",
      prompt: "Old?",
      options: ["a", "b"],
      correctIndex: 0,
    },
  ];

  it("appends valid questions by default", () => {
    const json = JSON.stringify([
      { prompt: "New?", options: ["1", "2", "3"], correctIndex: 2 },
    ]);
    const result = importMcqQuestionsFromJson(json, existing);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.questions.length, 2);
    assert.equal(result.imported, 1);
    assert.equal(result.questions[0]?.id, "q-existing");
  });

  it("replaces bank when replace is true", () => {
    const json = JSON.stringify([
      { prompt: "Only?", options: ["yes", "no"], correctIndex: 0 },
    ]);
    const result = importMcqQuestionsFromJson(json, existing, { replace: true });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.questions.length, 1);
    assert.equal(result.questions[0]?.prompt, "Only?");
  });

  it("rejects invalid JSON", () => {
    const result = importMcqQuestionsFromJson("{ bad", existing);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /Invalid JSON/i);
  });

  it("rejects empty payload", () => {
    const result = importMcqQuestionsFromJson("[]", existing);
    assert.equal(result.ok, false);
  });
});
