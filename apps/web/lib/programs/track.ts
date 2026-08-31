export type ProgramTrack = "ai" | "cyber" | "blockchain" | "quantum" | "data" | "general";

export type ProgramExperienceTier =
  | "entry"
  | "professional"
  | "executive"
  | "degree"
  | "general";

/** Subject track inferred from the programme title — used for a quiet accent. */
export function programTrack(title: string): ProgramTrack {
  const t = title.toLowerCase();
  if (/cyber|security|\bsoc\b/.test(t)) return "cyber";
  if (/blockchain|web3/.test(t)) return "blockchain";
  if (/quantum/.test(t)) return "quantum";
  if (/\bdata\b|analytics/.test(t)) return "data";
  if (/\bai\b|machine learning|\bml\b/.test(t)) return "ai";
  return "general";
}

export function inferProgramTrack(input: {
  title: string;
  domainSlug?: string | null;
  tags?: string[];
}): ProgramTrack {
  const slug = (input.domainSlug ?? "").toLowerCase();
  const tagBlob = (input.tags ?? []).join(" ").toLowerCase();
  const haystack = `${slug} ${tagBlob}`;

  if (/cyber|security|\bsoc\b/.test(haystack)) return "cyber";
  if (/blockchain|web3/.test(haystack)) return "blockchain";
  if (/quantum/.test(haystack)) return "quantum";
  if (/\bdata\b|analytics|datascience/.test(haystack)) return "data";
  if (/\bai\b|machine.?learning|\bml\b|deep.?learning/.test(haystack)) return "ai";

  return programTrack(input.title);
}

export function inferExperienceTier(
  domainSlug?: string | null,
  category?: string | null,
): ProgramExperienceTier {
  const slug = (domainSlug ?? "").toLowerCase();
  if (slug.startsWith("entry-level")) return "entry";
  if (slug.startsWith("professional")) return "professional";
  if (slug.includes("fellow-executive")) return "executive";
  if (category === "UNDERGRADUATE_DEGREE") return "degree";
  return "general";
}

export const TRACK_LABELS: Record<ProgramTrack, string> = {
  ai: "AI",
  cyber: "Cybersecurity",
  blockchain: "Blockchain",
  quantum: "Quantum",
  data: "Data Science",
  general: "Deep Tech",
};
