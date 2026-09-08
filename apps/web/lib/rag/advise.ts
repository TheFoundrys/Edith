import type { RetrievedChunk } from "@/lib/rag/index";
import type { PersonalityRecommendation } from "@/lib/assessments/personality-profile";

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

export function groundedStudentGuidance(input: {
  aptitudeBand: string;
  quantitativeBand: string;
  psycheTop: string;
  keywords: string[];
  retrieved: RetrievedChunk[];
  recommendations: PersonalityRecommendation[];
}) {
  const catalog = input.retrieved.filter((chunk) => chunk.source === "catalog");
  const resumeHit = input.retrieved.find((chunk) => chunk.source === "resume");
  const recTitles = input.recommendations.slice(0, 3).map((item) => item.slug);
  const catalogHint = catalog[0]?.metadata.title || recTitles[0] || "a Foundrys programme";
  const skill = input.keywords[0] ?? "your current craft";
  return [
    `Your Edith Personality Profile bands are ${input.aptitudeBand} aptitude and ${input.quantitativeBand} quantitative, with a ${input.psycheTop} psyche signature.`,
    resumeHit
      ? `Your resume (${skill}) aligns with ${catalogHint}. Sit with a trainer on how that maps to a Foundrys path.`
      : `Use the ${input.psycheTop} signature plus these scores to choose between a structured track and a stretch programme.`,
    recTitles.length
      ? `Start with ${recTitles.join(", ")} — then lock rank on the public Personality Profile board.`
      : `Complete the 90-question sitting so trainers can guide from a ranked result, not only a resume.`,
  ];
}

export function trainerBrief(input: {
  name: string;
  keywords: string[];
  aptitudeBand?: string;
  quantitativeBand?: string;
  psycheTop?: string;
  recommendations: PersonalityRecommendation[];
  retrieved: RetrievedChunk[];
}) {
  const examDone = Boolean(input.aptitudeBand && input.quantitativeBand);
  const rec = input.recommendations[0];
  const catalog = input.retrieved.find((chunk) => chunk.source === "catalog");
  const resume = input.retrieved.find((chunk) => chunk.source === "resume");
  return unique([
    examDone
      ? `${input.name}: ${input.aptitudeBand} aptitude / ${input.quantitativeBand} quantitative; psyche leans ${input.psycheTop}.`
      : `${input.name} has verified identity and a resume; the 90-question sitting is still open.`,
    resume
      ? `Resume tracks: ${input.keywords.join(", ") || "general"}. Quote this when opening the guidance conversation.`
      : `Little resume signal yet — ask for a current role and tools before recommending a track.`,
    rec
      ? `Suggested programme: ${rec.slug}. ${rec.reason}`
      : catalog
        ? `Catalogue neighbour: ${catalog.metadata.title ?? "a published programme"}.`
        : `No programme match yet — wait for the exam before a firm recommendation.`,
  ]).slice(0, 3);
}
