import test from "node:test";
import assert from "node:assert/strict";
import {
  applyOptionMap,
  buildKryptonMcqPaper,
  kryptonSeed,
  originalOptionIndex,
} from "../lib/assessments/krypton";
import {
  collectAadhaar,
  extractResumeKeywords,
  hasResumeOnFile,
  isAadhaarVerified,
  isIdentityComplete,
  isKycComplete,
  parseAadhaar,
  parseIdentityContact,
  parsePan,
  personalityIntakeLabel,
  personalityIntakeStage,
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

  const entered = recordEnteredAadhaar("123456789012");
  assert.equal("error" in entered, false);
  if ("error" in entered) return;
  assert.equal(entered.aadhaarSource, "aadhaar");
  assert.equal(entered.aadhaarMask, "XXXX-XXXX-9012");
  assert.equal(isAadhaarVerified(entered), true);

  const collected = collectAadhaar("1234 5678 9012");
  assert.equal("error" in collected, false);
  if ("error" in collected) return;
  assert.equal(collected.aadhaarLast4, "9012");

  const flexibleAadhaar = collectAadhaar("VID 9876");
  assert.equal("error" in flexibleAadhaar, false);
  if ("error" in flexibleAadhaar) return;
  assert.equal(flexibleAadhaar.aadhaarMask, "XXXX-XXXX-9876");

  const flexiblePan = parsePan("aa123");
  assert.equal("error" in flexiblePan, false);
  if ("error" in flexiblePan) return;
  assert.equal(flexiblePan.pan, "AA123");

  const contact = parseIdentityContact({
    name: "Ada",
    fullName: "Ada Lovelace",
    phone: "+91 98765 43210",
    email: "ada@example.com",
    address: "12 Baker Street, London",
  });
  assert.equal("error" in contact, false);
  if ("error" in contact) return;
  assert.equal(contact.phone, "919876543210");
  assert.equal(contact.email, "ada@example.com");

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

test("KYC is complete after contact, Aadhaar, PAN and resume", () => {
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

  const contact = {
    name: "Ada",
    fullName: "Ada Lovelace",
    phone: "9876543210",
    email: "ada@example.com",
    address: "12 Baker Street, London",
  };
  const withIds = {
    ...recorded,
    ...contact,
    panMask: "ABCDE****F",
    panHash: "abc",
  };
  assert.equal(isIdentityComplete(withIds), true);

  const complete = {
    ...withIds,
    resumePath: "kyc/resume.pdf",
    resumeFileName: "resume.pdf",
    resumeKeywords: [] as string[],
    completedAt: new Date().toISOString(),
  };
  assert.equal(isKycComplete(complete), true);

  const typed = recordEnteredAadhaar("123456789012");
  assert.equal("error" in typed, false);
  if ("error" in typed) return;
  assert.equal(
    isKycComplete({
      ...typed,
      ...contact,
      panMask: "ABCDE****F",
      panHash: "abc",
      resumePath: "kyc/resume.pdf",
      resumeFileName: "resume.pdf",
    }),
    true,
  );

  const missingSource = {
    ...contact,
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

test("personality intake stage reflects contact resume and exam", () => {
  assert.equal(personalityIntakeStage(undefined, false), "started");
  assert.equal(
    personalityIntakeLabel(
      {
        name: "Ada",
        fullName: "Ada Lovelace",
        phone: "9876543210",
        email: "ada@example.com",
        address: "12 Baker Street",
      },
      false,
    ),
    "Contact saved",
  );
  assert.equal(
    personalityIntakeStage(
      {
        name: "Ada",
        fullName: "Ada Lovelace",
        phone: "9876543210",
        email: "ada@example.com",
        address: "12 Baker Street",
        aadhaarHash: "h",
        aadhaarMask: "XXXX-XXXX-1234",
        aadhaarLast4: "1234",
        aadhaarSource: "aadhaar",
        panMask: "ABCDE****F",
        panHash: "p",
        resumePath: "kyc/r.pdf",
        resumeFileName: "r.pdf",
        resumeKeywords: ["ai"],
      },
      false,
    ),
    "exam",
  );
  assert.equal(
    personalityIntakeLabel(
      {
        name: "Ada",
        fullName: "Ada Lovelace",
        phone: "9876543210",
        email: "ada@example.com",
        address: "12 Baker Street",
        aadhaarHash: "h",
        aadhaarMask: "XXXX-XXXX-1234",
        aadhaarLast4: "1234",
        aadhaarSource: "aadhaar",
        panMask: "ABCDE****F",
        panHash: "p",
        resumePath: "kyc/r.pdf",
        resumeFileName: "r.pdf",
        resumeKeywords: ["ai"],
        completedAt: new Date().toISOString(),
      },
      true,
    ),
    "Exam complete",
  );
});

