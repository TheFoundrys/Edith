import test from "node:test";
import assert from "node:assert/strict";
import {
  applyOptionMap,
  buildKryptonMcqPaper,
  kryptonSeed,
  originalOptionIndex,
} from "../lib/assessments/krypton";
import {
  extractResumeKeywords,
  hasResumeOnFile,
  isAadhaarVerified,
  isIdentityComplete,
  isKycComplete,
  parseAadhaar,
  parsePan,
  recordDigilockerAadhaar,
  recordEnteredAadhaar,
  unlinkAadhaarFromKyc,
} from "../lib/assessments/personality-kyc";
import {
  createOauthState,
  fileHmacMatches,
  parseEaadhaarXml,
  readOauthState,
} from "../lib/digilocker/client";
import { createHmac } from "node:crypto";
import { APTITUDE_QUESTIONS } from "../lib/assessments/personality-questions";

test("Krypton Strength papers differ by candidate and remap to original options", () => {
  const ids = APTITUDE_QUESTIONS.map((q) => q.id);
  const counts = Object.fromEntries(
    APTITUDE_QUESTIONS.map((q) => [q.id, q.options.length]),
  );
  const a = buildKryptonMcqPaper(ids, counts, kryptonSeed("attempt-a", "aptitude"), true);
  const b = buildKryptonMcqPaper(ids, counts, kryptonSeed("attempt-b", "aptitude"), true);
  assert.deepEqual(
    buildKryptonMcqPaper(ids, counts, kryptonSeed("attempt-a", "aptitude"), true),
    a,
  );
  assert.notDeepEqual(a, b);

  const firstId = a.questionIds[0]!;
  const question = APTITUDE_QUESTIONS.find((q) => q.id === firstId)!;
  const displayed = applyOptionMap(question.options, a.optionMaps[firstId]);
  const displayedCorrect = displayed.indexOf(question.options[question.correctIndex]!);
  assert.equal(
    originalOptionIndex(a, firstId, displayedCorrect),
    question.correctIndex,
  );
});

test("Aadhaar uses Verhoeff; PAN is masked; resume keywords extract tracks", () => {
  const aadhaar = parseAadhaar("234123412340");
  assert.equal("error" in aadhaar, false);
  if ("error" in aadhaar) return;
  assert.equal(aadhaar.aadhaarMask, "XXXX-XXXX-2340");
  assert.equal(aadhaar.aadhaarLast4, "2340");

  const bad = parseAadhaar("123456789012");
  assert.equal("error" in bad, true);
  if ("error" in bad) {
    assert.match(bad.error, /checksum/i);
  }

  const pan = parsePan("abcde1234f");
  assert.equal("error" in pan, false);
  if ("error" in pan) return;
  assert.equal(pan.panMask, "ABCDE****F");
  assert.ok(pan.panHash.length > 20);

  const entered = recordEnteredAadhaar("234123412340");
  assert.equal("error" in entered, false);
  if ("error" in entered) return;
  assert.equal(entered.aadhaarSource, "aadhaar");
  assert.equal(entered.aadhaarMask, "XXXX-XXXX-2340");
  assert.equal(isAadhaarVerified(entered), true);

  assert.deepEqual(
    extractResumeKeywords("Senior Python ML engineer, SOC analyst").sort(),
    ["ai", "cyber"].sort(),
  );
});

test("DigiLocker e-Aadhaar XML is parsed and HMAC-checked", () => {
  const xml = `<?xml version="1.0"?><KycRes><UidData uid="234123412340"><Poi name="TEST USER"/></UidData></KycRes>`;
  const parsed = parseEaadhaarXml(xml);
  assert.equal("error" in parsed, false);
  if ("error" in parsed) return;
  assert.equal(parsed.uidDigits, "234123412340");
  assert.equal(parsed.last4, "2340");
  assert.equal(parsed.name, "TEST USER");

  const masked = parseEaadhaarXml(
    `<UidData uid="XXXXXXXX2340" name="MASKED NAME"></UidData>`,
  );
  assert.equal("error" in masked, false);
  if ("error" in masked) return;
  assert.equal(masked.uidDigits, "");
  assert.equal(masked.last4, "2340");

  const body = Buffer.from(xml, "utf8");
  const hmac = createHmac("sha256", "partner-secret").update(body).digest("base64");
  assert.equal(fileHmacMatches(body, hmac, "partner-secret"), true);
  assert.equal(fileHmacMatches(body, hmac, "wrong-secret"), false);
  const hex = createHmac("sha256", "partner-secret").update(body).digest("hex");
  assert.equal(fileHmacMatches(body, hex, "partner-secret"), true);
});

test("unlinking Aadhaar keeps PAN and resume on file", () => {
  const recorded = recordDigilockerAadhaar({
    uidDigits: "234123412340",
    last4: "2340",
    name: "TEST USER",
  });
  assert.equal("error" in recorded, false);
  if ("error" in recorded) return;
  const complete = {
    ...recorded,
    panMask: "ABCDE****F",
    panHash: "abc",
    resumePath: "kyc/resume.pdf",
    resumeFileName: "resume.pdf",
  };
  const stripped = unlinkAadhaarFromKyc(complete);
  assert.equal(isAadhaarVerified(stripped), false);
  assert.equal(isKycComplete(stripped), false);
  assert.equal(hasResumeOnFile(stripped), true);
  assert.equal(stripped.panMask, "ABCDE****F");
});

test("DigiLocker OAuth state carries a PKCE verifier", () => {
  const created = createOauthState("user-1", "org-1");
  const read = readOauthState(created.token);
  assert.equal(read?.nonce, created.nonce);
  assert.equal(read?.verifier, created.verifier);
  assert.equal(read?.userId, "user-1");
  assert.equal(readOauthState("tampered.token"), null);
});

test("KYC is complete after Aadhaar (typed or DigiLocker) plus PAN and resume", () => {
  const recorded = recordDigilockerAadhaar({
    uidDigits: "234123412340",
    last4: "2340",
    name: "TEST USER",
  });
  assert.equal("error" in recorded, false);
  if ("error" in recorded) return;
  assert.equal(isAadhaarVerified(recorded), true);
  assert.equal(isIdentityComplete(recorded), false);
  assert.equal(isKycComplete(recorded), false);

  const complete = {
    ...recorded,
    panMask: "ABCDE****F",
    panHash: "abc",
    resumePath: "kyc/resume.pdf",
    resumeFileName: "resume.pdf",
    resumeKeywords: [] as string[],
    completedAt: new Date().toISOString(),
  };
  assert.equal(isIdentityComplete(complete), true);
  assert.equal(isKycComplete(complete), true);

  const typed = recordEnteredAadhaar("234123412340");
  assert.equal("error" in typed, false);
  if ("error" in typed) return;
  assert.equal(
    isKycComplete({
      ...typed,
      panMask: "ABCDE****F",
      panHash: "abc",
      resumePath: "kyc/resume.pdf",
      resumeFileName: "resume.pdf",
    }),
    true,
  );

  const missingSource = {
    aadhaarMask: "XXXX-XXXX-2340",
    aadhaarLast4: "2340",
    aadhaarHash: "hash",
    panMask: "ABCDE****F",
    panHash: "abc",
    resumePath: "kyc/resume.pdf",
    resumeFileName: "resume.pdf",
  };
  assert.equal(isKycComplete(missingSource), false);
});

