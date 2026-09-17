import assert from "node:assert/strict";
import test from "node:test";
import {
  lessonMcqAiTopic,
  quizDraftToMcqQuestions,
  topicForMcqSet,
} from "@/lib/assessments/course-mcq-ai";

test("quizDraftToMcqQuestions normalizes AI output", () => {
  const bank = quizDraftToMcqQuestions({
    title: "Test",
    description: "Desc",
    questions: [
      {
        prompt: "What is 2+2?",
        options: ["4", "5", "6", "7"],
        correctIndex: 0,
      },
    ],
  });
  assert.equal(bank.length, 1);
  assert.equal(bank[0]?.correctIndex, 0);
});

test("topicForMcqSet includes set focus", () => {
  const topic = topicForMcqSet({
    programTitle: "AI Fluency",
    setNumber: 2,
    setCount: 3,
    focus: "application scenarios",
  });
  assert.match(topic, /Set 2 of 3/);
  assert.match(topic, /application scenarios/);
});

test("lessonMcqAiTopic includes lesson title", () => {
  const topic = lessonMcqAiTopic({
    lessonTitle: "Prompting basics",
    extraTopic: "few-shot examples",
  });
  assert.match(topic, /Prompting basics/);
  assert.match(topic, /few-shot examples/);
});
