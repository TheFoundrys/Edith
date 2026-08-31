import test from "node:test";
import assert from "node:assert/strict";
import { isStaffRole } from "../lib/auth/roles";
import {
  canAuthenticateMembership,
  membershipAccessState,
} from "../lib/members/status";

test("membership access treats suspend ahead of expiry", () => {
  const expired = new Date("2020-01-01T00:00:00.000Z");
  assert.equal(
    membershipAccessState({ status: "SUSPENDED", expiresAt: expired }),
    "suspended",
  );
  assert.equal(
    membershipAccessState({ status: "ACTIVE", expiresAt: expired }),
    "expired",
  );
  assert.equal(
    membershipAccessState({ status: "ACTIVE", expiresAt: null }),
    "active",
  );
  assert.equal(
    canAuthenticateMembership({ status: "SUSPENDED", expiresAt: null }),
    false,
  );
  assert.equal(
    canAuthenticateMembership({
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 60_000),
    }),
    true,
  );
});

test("staff invites are limited to staff roles", () => {
  assert.equal(isStaffRole("SUPER_ADMIN"), true);
  assert.equal(isStaffRole("ADMISSIONS_MANAGER"), true);
  assert.equal(isStaffRole("STUDENT"), false);
  assert.equal(isStaffRole("PARENT"), false);
});
