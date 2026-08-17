export type ProgramTrack = "ai" | "cyber" | "blockchain" | "quantum" | "data" | "general";

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
