import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildResumeRecommendationQuery,
  catalogSlugScoresFromRetrieval,
  resumeTrackAffinityBoost,
} from "../lib/learning/resume-signals";
import type { RetrievedChunk } from "../lib/rag/index";

describe("buildResumeRecommendationQuery", () => {
  it("combines skill labels, keywords, and profile fields", () => {
    const query = buildResumeRecommendationQuery({
      keywords: ["cyber", "ai"],
      skillLabels: ["cybersecurity", "AI / machine learning"],
      headline: "SOC analyst",
      careerPath: "Security lead",
    });
    assert.match(query, /cybersecurity/i);
    assert.match(query, /SOC analyst/i);
    assert.match(query, /Foundrys programme/i);
  });
});

describe("catalogSlugScoresFromRetrieval", () => {
  it("normalizes best catalog hit per slug to 1", () => {
    const chunks: RetrievedChunk[] = [
      {
        source: "catalog",
        text: "Cyber programme",
        score: 0.8,
        metadata: { slug: "pgp-cybersecurity-analyst", title: "Cyber PGP" },
      },
      {
        source: "catalog",
        text: "Cyber programme duplicate",
        score: 0.4,
        metadata: { slug: "pgp-cybersecurity-analyst", title: "Cyber PGP" },
      },
      {
        source: "catalog",
        text: "AI programme",
        score: 0.5,
        metadata: { slug: "pgp-applied-ai-genai", title: "AI PGP" },
      },
      {
        source: "resume",
        text: "ignored",
        score: 0.99,
        metadata: {},
      },
    ];
    const scores = catalogSlugScoresFromRetrieval(chunks);
    assert.equal(scores.get("pgp-cybersecurity-analyst"), 1);
    assert.ok((scores.get("pgp-applied-ai-genai") ?? 0) > 0);
    assert.ok((scores.get("pgp-applied-ai-genai") ?? 0) < 1);
  });

  it("returns empty map when no catalog chunks", () => {
    assert.equal(catalogSlugScoresFromRetrieval([]).size, 0);
  });
});

describe("resumeTrackAffinityBoost", () => {
  it("boosts known resume tracks only", () => {
    const boost = resumeTrackAffinityBoost(["ai", "cyber", "people"]);
    assert.equal(boost.ai, 0.55);
    assert.equal(boost.cyber, 0.55);
    assert.equal("people" in boost, false);
  });
});
