import test from "node:test";
import assert from "node:assert/strict";
import { adminNavGroupsFor } from "../lib/admin/nav";
import {
  DEFAULT_ROLE_CAPABILITIES,
  ROLE_LABELS,
  STAFF_PERMISSION_ROLES,
  can,
  isStaffRole,
} from "../lib/auth/roles";

test("staff labels match the institute control-centre roles", () => {
  assert.equal(ROLE_LABELS.SUPER_ADMIN, "Super Administrator");
  assert.equal(ROLE_LABELS.ADMISSIONS_MANAGER, "Academic Dean / Head");
  assert.equal(ROLE_LABELS.BURSAR, "Bursar & Finance");
  assert.equal(ROLE_LABELS.COUNSELOR, "Admissions Staff");
  assert.equal(ROLE_LABELS.CONTENT_UPLOADER, "Lead Faculty / Teachers");
  assert.deepEqual(STAFF_PERMISSION_ROLES, [
    "SUPER_ADMIN",
    "ADMISSIONS_MANAGER",
    "BURSAR",
    "COUNSELOR",
    "CONTENT_UPLOADER",
  ]);
});

test("default capabilities separate academic, finance, intake, and faculty", () => {
  assert.equal(can("ADMISSIONS_MANAGER", "managePrograms"), true);
  assert.equal(can("ADMISSIONS_MANAGER", "manageContent"), true);
  assert.equal(can("ADMISSIONS_MANAGER", "manageApplications"), true);
  assert.equal(can("ADMISSIONS_MANAGER", "managePricing"), false);
  assert.equal(can("ADMISSIONS_MANAGER", "manageAiPlugins"), false);

  assert.deepEqual(DEFAULT_ROLE_CAPABILITIES.BURSAR, ["managePricing"]);
  assert.equal(can("BURSAR", "manageApplications"), false);
  assert.equal(isStaffRole("BURSAR"), true);

  assert.equal(can("COUNSELOR", "manageApplications"), true);
  assert.equal(can("COUNSELOR", "manageForms"), true);
  assert.equal(can("COUNSELOR", "manageContent"), false);

  assert.equal(can("CONTENT_UPLOADER", "manageContent"), true);
  assert.equal(can("CONTENT_UPLOADER", "managePrograms"), true);
  assert.equal(can("CONTENT_UPLOADER", "manageApplications"), false);
});

test("bursar nav is commerce only; dean keeps academics without fees", () => {
  const bursarNav = adminNavGroupsFor((cap) => cap === "managePricing", false);
  const bursarLabels = bursarNav.map((group) => group.label);
  assert.ok(bursarLabels.includes("Overview"));
  assert.ok(bursarLabels.includes("Catalog"));
  assert.ok(bursarLabels.includes("Commerce"));
  assert.ok(!bursarLabels.includes("Admissions"));
  assert.ok(!bursarLabels.includes("Teaching"));
  assert.ok(!bursarLabels.includes("People"));

  const deanNav = adminNavGroupsFor(
    (cap) =>
      [
        "managePrograms",
        "manageContent",
        "manageApplications",
        "manageForms",
        "manageMembers",
      ].includes(cap),
    false,
  );
  const deanLabels = deanNav.map((group) => group.label);
  assert.ok(deanLabels.includes("Admissions"));
  assert.ok(deanLabels.includes("Catalog"));
  assert.ok(deanLabels.includes("Teaching"));
  assert.ok(deanLabels.includes("People"));
  assert.ok(!deanLabels.includes("Commerce"));
});
