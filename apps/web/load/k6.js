/**
 * Edith load test (k6).
 *
 *   brew install k6
 *   BASE_URL=http://localhost:3059 k6 run apps/web/load/k6.js
 *
 * Login happens once in setup() so we do not trip the 10/15min login rate limit.
 * This script is read-only: it never submits assignments or posts grades.
 *
 * Env:
 *   BASE_URL            default http://localhost:3059
 *   STUDENT_EMAIL       default student@example.com
 *   STUDENT_PASSWORD    default password123
 *   K6_VUS              default 10
 *   K6_DURATION         default 30s
 */
import http from "k6/http";
import { check, group, sleep } from "k6";

const BASE = (__ENV.BASE_URL || "http://localhost:3059").replace(/\/$/, "");
const EMAIL = __ENV.STUDENT_EMAIL || "student@example.com";
const PASSWORD = __ENV.STUDENT_PASSWORD || "password123";

export const options = {
  vus: Number(__ENV.K6_VUS || 10),
  duration: __ENV.K6_DURATION || "30s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<4000"],
    checks: ["rate>0.9"],
  },
};

const PUBLIC_PATHS = [
  "/api/health",
  "/",
  "/courses",
  "/login",
  "/api/catalog/courses",
  "/api/catalog/filters",
];

const STUDENT_PATHS = [
  "/student/dashboard",
  "/student/my-courses",
  "/student/assignments",
  "/student/submissions",
  "/student/learn",
  "/student/assessments",
  "/student/personality-profile",
  "/student/notifications",
];

function applyCookies(cookieMap) {
  const jar = http.cookieJar();
  for (const [name, values] of Object.entries(cookieMap || {})) {
    const value = Array.isArray(values) ? values[0] : values;
    if (value) jar.set(BASE, name, value);
  }
}

export function setup() {
  const health = http.get(`${BASE}/api/health`);
  if (health.status !== 200) {
    throw new Error(`Health check failed (${health.status}) at ${BASE}/api/health`);
  }

  const csrfRes = http.get(`${BASE}/api/auth/csrf`);
  const csrfToken = csrfRes.json("csrfToken");
  if (!csrfToken) {
    throw new Error("Could not read CSRF token from /api/auth/csrf");
  }

  const login = http.post(
    `${BASE}/api/auth/callback/credentials`,
    {
      csrfToken,
      email: EMAIL,
      password: PASSWORD,
      redirect: "false",
      json: "true",
      callbackUrl: `${BASE}/student/dashboard`,
    },
    { redirects: 0 },
  );

  const cookies = http.cookieJar().cookiesForURL(BASE);
  const hasSession = Object.keys(cookies).some((name) =>
    name.includes("session-token"),
  );
  if (!hasSession) {
    throw new Error(
      `Student login failed (HTTP ${login.status}). Check STUDENT_EMAIL/PASSWORD and login rate limit.`,
    );
  }

  return { cookies };
}

export default function (data) {
  applyCookies(data.cookies);

  if (Math.random() < 0.65) {
    group("public", () => {
      const path = PUBLIC_PATHS[Math.floor(Math.random() * PUBLIC_PATHS.length)];
      const res = http.get(`${BASE}${path}`, { tags: { surface: "public" } });
      check(res, {
        "public status ok": (r) => r.status >= 200 && r.status < 400,
      });
    });
  } else {
    group("student", () => {
      const path = STUDENT_PATHS[Math.floor(Math.random() * STUDENT_PATHS.length)];
      const res = http.get(`${BASE}${path}`, { tags: { surface: "student" } });
      check(res, {
        "student status ok": (r) => r.status >= 200 && r.status < 400,
        "student not bounced to login": (r) =>
          !String(r.url).includes("/login"),
      });
    });
  }

  sleep(0.3);
}
