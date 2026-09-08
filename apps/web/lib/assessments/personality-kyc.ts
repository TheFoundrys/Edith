import { createHmac } from "node:crypto";

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAAR_RE = /^\d{12}$/;

/** Verhoeff tables for Aadhaar checksum. */
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 1, 5, 0, 8, 9, 6, 7],
  [3, 4, 1, 2, 8, 5, 7, 6, 0, 9],
  [4, 0, 6, 8, 7, 1, 9, 2, 5, 3],
  [5, 9, 7, 6, 2, 3, 0, 4, 1, 8],
  [6, 5, 8, 3, 9, 7, 1, 0, 4, 2],
  [7, 8, 9, 0, 6, 4, 2, 5, 3, 1],
  [8, 9, 0, 5, 3, 2, 4, 1, 7, 6],
  [9, 6, 1, 7, 4, 8, 5, 3, 2, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 7, 8, 6, 0],
  [4, 2, 8, 6, 5, 7, 9, 3, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
function hmacKey() {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "edith-kyc-dev-only"
  );
}

function digest(kind: "aadhaar" | "pan", value: string) {
  return createHmac("sha256", hmacKey())
    .update(`edith:kyc:${kind}:${value}`)
    .digest("hex");
}

export function normalizePan(raw: string) {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function normalizeAadhaar(raw: string) {
  return raw.replace(/\D/g, "");
}

export function aadhaarChecksumOk(digits: string) {
  if (!AADHAAR_RE.test(digits)) return false;
  let c = 0;
  const reversed = digits.split("").reverse();
  for (let i = 0; i < reversed.length; i += 1) {
    c = D[c]![P[i % 8]![Number(reversed[i])]!]!;
  }
  return c === 0;
}

export function parsePan(raw: string):
  | { error: string }
  | { pan: string; panMask: string; panHash: string } {
  const pan = normalizePan(raw);
  if (!PAN_RE.test(pan)) {
    return { error: "Enter a valid PAN (ABCDE1234F)." };
  }
  return {
    pan,
    panMask: `${pan.slice(0, 5)}****${pan.slice(-1)}`,
    panHash: digest("pan", pan),
  };
}

export function parseAadhaar(raw: string):
  | { error: string }
  | { aadhaarLast4: string; aadhaarMask: string; aadhaarHash: string } {
  const aadhaar = normalizeAadhaar(raw);
  if (!AADHAAR_RE.test(aadhaar)) {
    return { error: "Enter all 12 digits of your Aadhaar number." };
  }
  if (!aadhaarChecksumOk(aadhaar)) {
    return {
      error:
        "That number failed the Aadhaar checksum. Check the 12 digits and try again.",
    };
  }
  return {
    aadhaarLast4: aadhaar.slice(-4),
    aadhaarMask: `XXXX-XXXX-${aadhaar.slice(-4)}`,
    aadhaarHash: digest("aadhaar", aadhaar),
  };
}

const TRACK_KEYWORDS: Record<string, string[]> = {
  ai: [
    "ai",
    "ml",
    "machine learning",
    "deep learning",
    "genai",
    "llm",
    "python",
    "pytorch",
    "tensorflow",
    "nlp",
    "data scientist",
  ],
  cyber: [
    "cyber",
    "security",
    "soc",
    "pentest",
    "network",
    "infosec",
    "cissp",
    "siem",
    "vulnerability",
  ],
  data: [
    "sql",
    "excel",
    "tableau",
    "power bi",
    "analytics",
    "statistic",
    "etl",
    "warehouse",
  ],
  quantum: ["quantum", "qiskit", "qubit"],
  blockchain: ["blockchain", "web3", "solidity", "ethereum", "defi"],
  people: ["teach", "trainer", "faculty", "educator", "hr", "counsel", "mentor"],
};

export function extractResumeKeywords(text: string) {
  const haystack = text.toLowerCase();
  const found = new Set<string>();
  for (const [track, words] of Object.entries(TRACK_KEYWORDS)) {
    if (words.some((word) => haystack.includes(word))) found.add(track);
  }
  return [...found];
}

export type AadhaarSource = "digilocker" | "aadhaar";

export type PersonalityKyc = {
  panMask?: string;
  panHash?: string;
  aadhaarMask: string;
  aadhaarLast4: string;
  aadhaarHash: string;
  aadhaarSource: AadhaarSource;
  aadhaarName?: string;
  aadhaarVerifiedAt?: string;
  resumePath?: string;
  resumeFileName?: string;
  resumeKeywords?: string[];
  resumeText?: string;
  indexedAt?: string;
  completedAt?: string;
};

export function isAadhaarVerified(value: unknown): value is PersonalityKyc {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const kyc = value as Partial<PersonalityKyc>;
  return Boolean(
    kyc.aadhaarHash &&
      kyc.aadhaarMask &&
      kyc.aadhaarLast4 &&
      (kyc.aadhaarSource === "digilocker" || kyc.aadhaarSource === "aadhaar"),
  );
}

export function hasResumeOnFile(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const kyc = value as Partial<PersonalityKyc>;
  return Boolean(kyc.resumePath && kyc.resumeFileName);
}

const AADHAAR_KYC_KEYS = [
  "aadhaarMask",
  "aadhaarLast4",
  "aadhaarHash",
  "aadhaarSource",
  "aadhaarName",
  "aadhaarVerifiedAt",
] as const;

/** Drop Aadhaar fields. PAN and resume stay on the attempt. */
export function unlinkAadhaarFromKyc(kyc: unknown): Record<string, unknown> {
  const next =
    kyc && typeof kyc === "object" && !Array.isArray(kyc)
      ? { ...(kyc as Record<string, unknown>) }
      : {};
  for (const key of AADHAAR_KYC_KEYS) delete next[key];
  return next;
}

export function hasPanOnFile(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const kyc = value as Partial<PersonalityKyc>;
  return Boolean(kyc.panHash && kyc.panMask);
}

export function isIdentityComplete(
  value: unknown,
): value is PersonalityKyc & { panMask: string; panHash: string } {
  return isAadhaarVerified(value) && hasPanOnFile(value);
}

export function isResumeComplete(value: unknown): boolean {
  if (!isIdentityComplete(value)) return false;
  const kyc = value as PersonalityKyc;
  return Boolean(kyc.resumePath && kyc.resumeFileName);
}

export function isKycComplete(value: unknown): value is PersonalityKyc & {
  panMask: string;
  panHash: string;
  resumePath: string;
  resumeFileName: string;
  resumeKeywords: string[];
  completedAt: string;
} {
  return isResumeComplete(value);
}

export function personalityWizardStep(input: {
  identity: boolean;
  resume: boolean;
  exam: boolean;
}): 1 | 2 | 3 {
  if (!input.identity) return 1;
  if (!input.resume) return 2;
  return 3;
}

/** Hash + mask from DigiLocker e-Aadhaar. Never persist the raw UID. */
export function recordDigilockerAadhaar(input: {
  uidDigits: string;
  last4: string;
  name: string;
}) {
  const uid = normalizeAadhaar(input.uidDigits);
  const parsed = uid.length === 12 ? parseAadhaar(uid) : null;
  if (parsed && !("error" in parsed)) {
    return {
      ...parsed,
      aadhaarSource: "digilocker" as const,
      aadhaarName: input.name.trim() || undefined,
      aadhaarVerifiedAt: new Date().toISOString(),
    };
  }
  const last4 = input.last4.replace(/\D/g, "").slice(-4);
  if (last4.length !== 4) {
    return { error: "DigiLocker did not return a usable Aadhaar reference." };
  }
  return {
    aadhaarLast4: last4,
    aadhaarMask: `XXXX-XXXX-${last4}`,
    aadhaarHash: digest("aadhaar", `digilocker-last4:${last4}`),
    aadhaarSource: "digilocker" as const,
    aadhaarName: input.name.trim() || undefined,
    aadhaarVerifiedAt: new Date().toISOString(),
  };
}

/** Hash + mask from a typed 12-digit Aadhaar. Never persist the raw UID. */
export function recordEnteredAadhaar(raw: string):
  | { error: string }
  | {
      aadhaarLast4: string;
      aadhaarMask: string;
      aadhaarHash: string;
      aadhaarSource: "aadhaar";
      aadhaarVerifiedAt: string;
    } {
  const parsed = parseAadhaar(raw);
  if ("error" in parsed) return parsed;
  return {
    aadhaarLast4: parsed.aadhaarLast4,
    aadhaarMask: parsed.aadhaarMask,
    aadhaarHash: parsed.aadhaarHash,
    aadhaarSource: "aadhaar",
    aadhaarVerifiedAt: new Date().toISOString(),
  };
}
