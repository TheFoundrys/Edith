import test from "node:test";
import assert from "node:assert/strict";
import { resolveAuthRedirect } from "../lib/auth/redirect";
import { courseCoverSrc } from "../lib/programs/course-visual";
import {
  absoluteUrl,
  isBindAllHost,
  publicRequestOrigin,
  publicRequestUrl,
  ROUTES,
  uploadUrl,
} from "../lib/urls";

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

test("publicRequestOrigin never sends the browser to 0.0.0.0", () => {
  const prev = {
    SITE_URL: process.env.SITE_URL,
    AUTH_URL: process.env.AUTH_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  };
  process.env.SITE_URL = "";
  process.env.AUTH_URL = "http://localhost:3059";
  process.env.NEXTAUTH_URL = "http://localhost:3059";

  try {
    assert.equal(
      publicRequestOrigin({
        url: "http://0.0.0.0:3059/api/auth/clear-stale",
        headers: new Headers({ host: "localhost:3059" }),
      }),
      "http://localhost:3059",
    );
    assert.equal(
      publicRequestOrigin({
        url: "http://0.0.0.0:3059/login?notice=session_expired",
        headers: new Headers({ host: "0.0.0.0:3059" }),
      }),
      "http://localhost:3059",
    );
    assert.equal(
      publicRequestOrigin({
        url: "http://0.0.0.0:3059/login",
        headers: new Headers({
          host: "0.0.0.0:3059",
          "x-forwarded-host": "app.example.com",
          "x-forwarded-proto": "https",
        }),
      }),
      "https://app.example.com",
    );
    assert.equal(isBindAllHost("0.0.0.0:3059"), true);
    assert.equal(isBindAllHost("localhost:3059"), false);
    assert.equal(
      publicRequestUrl(
        {
          url: "http://0.0.0.0:3059/api/auth/clear-stale",
          headers: new Headers({ host: "0.0.0.0:3059" }),
        },
        "/login?notice=session_expired",
      ).href,
      "http://localhost:3059/login?notice=session_expired",
    );
  } finally {
    process.env.SITE_URL = prev.SITE_URL;
    process.env.AUTH_URL = prev.AUTH_URL;
    process.env.NEXTAUTH_URL = prev.NEXTAUTH_URL;
  }
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

test("course cards load real Unsplash photographs by subject", () => {
  const ai = courseCoverSrc("ai", "Applied AI");
  const cyber = courseCoverSrc("cyber", "Cybersecurity Essentials");
  assert.match(ai, /^https:\/\/images\.unsplash\.com\/photo-/);
  assert.match(cyber, /^https:\/\/images\.unsplash\.com\/photo-/);
  assert.notEqual(ai, cyber);
  assert.equal(courseCoverSrc("ai", "Applied AI"), ai);
});
