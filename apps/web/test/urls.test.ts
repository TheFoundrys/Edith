import test from "node:test";
import assert from "node:assert/strict";
import { resolveAuthRedirect } from "../lib/auth/redirect";
import { absoluteUrl, ROUTES, uploadUrl } from "../lib/urls";

test("uploadUrl normalizes storage paths", () => {
  assert.equal(uploadUrl("public\\abc\\file.png"), "/api/uploads/public/abc/file.png");
  assert.equal(uploadUrl("private/id/doc.pdf"), "/api/uploads/private/id/doc.pdf");
});

test("absoluteUrl joins origin and path", () => {
  const prev = process.env.SITE_URL;
  process.env.SITE_URL = "https://app.example.com";
  assert.equal(absoluteUrl("/login"), "https://app.example.com/login");
  process.env.SITE_URL = prev;
});

test("auth redirect allows public marketing callbacks for students", () => {
  assert.equal(
    resolveAuthRedirect("STUDENT", ROUTES.personalityProfile),
    ROUTES.personalityProfile,
  );
  assert.equal(
    resolveAuthRedirect("STUDENT", "/courses/edith-ai-bootcamp/intakes"),
    "/courses/edith-ai-bootcamp/intakes",
  );
  assert.equal(resolveAuthRedirect("STUDENT", "/admin"), ROUTES.studentDashboard);
});

test("auth redirects cannot cross role boundaries or origins", () => {
  assert.equal(
    resolveAuthRedirect("STUDENT", "https://evil.example"),
    ROUTES.studentDashboard,
  );
  assert.equal(resolveAuthRedirect("STUDENT", "/admin"), ROUTES.studentDashboard);
  assert.equal(resolveAuthRedirect("SUPER_ADMIN", "/admin/members"), "/admin/members");
  assert.equal(resolveAuthRedirect("SUPER_ADMIN", "/student/payment"), ROUTES.admin);
});
