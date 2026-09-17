import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildIntegrityReports,
  compareIntegrityTexts,
  riskFromScore,
} from "../lib/learning/assignment-integrity";

test("identical essays score as high plagiarism", () => {
  const essay =
    "Machine learning models learn patterns from labelled examples and then predict labels for unseen inputs with measurable accuracy.";
  const result = compareIntegrityTexts(essay, essay);
  assert.ok(result.score > 0.9);
  assert.equal(riskFromScore(result.score), "high");
});

test("unrelated essays stay below the review threshold", () => {
  const result = compareIntegrityTexts(
    "Photosynthesis converts sunlight into chemical energy inside chloroplasts of plant leaves.",
    "The French Revolution began in 1789 after a fiscal crisis and popular unrest in Paris.",
  );
  assert.ok(result.score < 0.14);
});

test("copied paragraphs flag a peer match for faculty reports", () => {
  const copied =
    "Gradient descent updates model weights by moving against the gradient of the loss function until training converges on a local minimum.";
  const reports = buildIntegrityReports([
    {
      id: "a",
      userId: "u1",
      userName: "Ada",
      contentBody: `Intro notes about neural nets. ${copied} Closing thoughts on regularisation.`,
    },
    {
      id: "b",
      userId: "u2",
      userName: "Ben",
      contentBody: `Different opening. ${copied} A short original ending.`,
    },
  ]);
  const ada = reports.get("a");
  assert.ok(ada);
  assert.equal(ada.risk, "high");
  assert.equal(ada.matches[0]?.peerName, "Ben");
  assert.ok((ada.matches[0]?.samplePhrases.length ?? 0) > 0);
});
