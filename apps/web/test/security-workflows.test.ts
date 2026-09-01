import test from "node:test";
import assert from "node:assert/strict";
import { adminNavGroupsFor } from "../lib/admin/nav";
import { ROUTES } from "../lib/urls";
import { coursePrice, isFreeCourse } from "../lib/programs/pricing";
import { canTransition } from "../lib/workflows/status";

test("course tuition never falls back to an application fee", () => {
  assert.equal(coursePrice({ price: null }), 0);
  assert.equal(coursePrice({ price: 2500 }), 2500);
  assert.equal(isFreeCourse({ price: 0 }), true);
});

test("admin sidebar groups people separately from applications", () => {
  const groups = adminNavGroupsFor(() => true, true);
  const labels = groups.map((group) => group.label);
  assert.deepEqual(
    labels,
    [
      "Overview",
      "People",
      "Catalog",
      "Teaching",
      "Admissions",
      "Commerce",
      "Communications",
      "Platform",
    ],
  );
  const people = groups.find((group) => group.label === "People");
  assert.deepEqual(
    people?.items.map((item) => item.href),
    [
      "/admin/members",
      "/admin/members/invites",
      "/admin/members/groups",
      "/admin/members/activity",
      "/admin/members/roles",
    ],
  );
  const admissions = groups.find((group) => group.label === "Admissions");
  assert.ok(admissions?.items.some((item) => item.href === "/admin/applications"));
  assert.ok(!admissions?.items.some((item) => item.href.startsWith("/admin/members")));

  const commerce = groups.find((group) => group.label === "Commerce");
  assert.ok(commerce?.items.some((item) => item.href === ROUTES.adminPayments));
  assert.ok(commerce?.items.some((item) => item.href === ROUTES.adminPaymentSettings));

  const admissionsNav = adminNavGroupsFor(
    (cap) =>
      [
        "managePricing",
        "managePrograms",
        "manageApplications",
        "manageForms",
      ].includes(cap),
    false,
  );
  const admissionsCommerce = admissionsNav.find(
    (group) => group.label === "Commerce",
  );
  assert.ok(
    admissionsCommerce?.items.some((item) => item.href === ROUTES.adminPayments),
  );
  assert.ok(
    !admissionsCommerce?.items.some(
      (item) => item.href === ROUTES.adminPaymentSettings,
    ),
  );

  const withoutPeople = adminNavGroupsFor(
    (cap) => cap !== "manageMembers",
    false,
  );
  assert.equal(
    withoutPeople.some((group) => group.label === "People"),
    false,
  );
  assert.equal(
    withoutPeople.some((group) =>
      group.items.some((item) => item.href === "/admin/members/roles"),
    ),
    false,
  );
});

test("application workflow blocks invalid terminal transitions", () => {
  assert.equal(canTransition("DRAFT", "SUBMITTED"), true);
  assert.equal(canTransition("REJECTED", "ENROLLED"), false);
  assert.equal(canTransition("ENROLLED", "PAID"), false);
  assert.equal(canTransition("PAID", "ENROLLED"), true);
});
