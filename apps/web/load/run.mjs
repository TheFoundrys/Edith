#!/usr/bin/env node
/**
 * Edith load test (Node 22, no extra packages).
 *
 * Keep the app running in a *separate* terminal (`npm run dev` or `npm start`).
 * Then in this terminal:
 *
 *   npm run load:test
 *   USERS=100 DURATION=60 npm run load:test
 *
 * Logs in once as the demo student, then mixes public + student GETs.
 * Read-only: does not submit assignments.
 */
const BASE = (process.env.BASE_URL || "http://localhost:3059").replace(/\/$/, "");
const EMAIL = process.env.STUDENT_EMAIL || "student@example.com";
const PASSWORD = process.env.STUDENT_PASSWORD || "password123";
const VUS = Math.max(
  1,
  Number(process.env.USERS || process.env.LOAD_VUS || 8),
);
const SECONDS = Math.max(
  5,
  Number(process.env.DURATION || process.env.LOAD_SECONDS || 30),
);
const THINK_MS = Math.max(50, Number(process.env.LOAD_THINK_MS || 350));

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

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  );
  return sorted[index];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cookieHeader(cookieMap) {
  return Object.entries(cookieMap)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function mergeSetCookies(current, setCookieHeaders) {
  const next = { ...current };
  for (const header of setCookieHeaders) {
    const pair = header.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    next[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return next;
}

async function readSetCookies(res) {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function errorCode(error) {
  const cause = error instanceof Error ? error.cause : null;
  if (cause && typeof cause === "object" && "code" in cause) {
    return String(cause.code);
  }
  return error instanceof Error ? error.message : "error";
}

function formatFetchError(error, url) {
  const code = errorCode(error);
  if (url.includes("your-host") || url.includes("...")) {
    return `BASE_URL is still the placeholder (${url}). For local use: npm run load:test`;
  }
  if (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "UND_ERR_SOCKET" ||
    error instanceof TypeError
  ) {
    return `Cannot reach ${url}. Start the app in another terminal with npm run dev, then run: npm run load:test`;
  }
  return error instanceof Error ? `${error.message} (${url})` : String(error);
}

async function login() {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  let cookies = mergeSetCookies({}, await readSetCookies(csrfRes));
  const { csrfToken } = await csrfRes.json();
  if (!csrfToken) throw new Error("No csrfToken from /api/auth/csrf");

  const body = new URLSearchParams({
    csrfToken,
    email: EMAIL,
    password: PASSWORD,
    redirect: "false",
    json: "true",
    callbackUrl: `${BASE}/student/dashboard`,
  });

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(cookies),
    },
    body,
    redirect: "manual",
  });
  cookies = mergeSetCookies(cookies, await readSetCookies(loginRes));

  const hasSession = Object.keys(cookies).some((name) =>
    name.includes("session-token"),
  );
  if (!hasSession) {
    throw new Error(
      `Student login failed (HTTP ${loginRes.status}). Check credentials and the 10-login / 15min rate limit.`,
    );
  }
  return cookies;
}

async function hit(path, cookies) {
  const started = performance.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: cookies ? { cookie: cookieHeader(cookies) } : undefined,
      redirect: "manual",
    });
    let ok = res.status >= 200 && res.status < 400;
    if (
      path.startsWith("/student") &&
      String(res.headers.get("location") || "").includes("/login")
    ) {
      ok = false;
    }
    return {
      path,
      status: res.status,
      ok,
      kind: "http",
      ms: performance.now() - started,
    };
  } catch (error) {
    return {
      path,
      status: 0,
      ok: false,
      kind: errorCode(error),
      ms: performance.now() - started,
    };
  }
}

async function worker(endAt, cookies, results) {
  while (Date.now() < endAt) {
    const student = Math.random() >= 0.65;
    const pool = student ? STUDENT_PATHS : PUBLIC_PATHS;
    const path = pool[Math.floor(Math.random() * pool.length)];
    results.push(await hit(path, student ? cookies : undefined));
    await sleep(THINK_MS);
  }
}

async function main() {
  if (BASE.includes("your-host") || EMAIL.includes("...")) {
    throw new Error(
      "Replace BASE_URL / STUDENT_EMAIL / STUDENT_PASSWORD with real values. For local: npm run load:test",
    );
  }
  let health;
  try {
    health = await fetch(`${BASE}/api/health`);
  } catch (error) {
    throw new Error(formatFetchError(error, `${BASE}/api/health`));
  }
  if (!health.ok) {
    throw new Error(`Health check failed (${health.status}) at ${BASE}/api/health`);
  }
  console.log(`Target ${BASE}`);
  console.log(`Logging in as ${EMAIL} once (avoids login rate limit)…`);
  const cookies = await login();
  console.log(
    `Running ${VUS} users for ${SECONDS}s with ${THINK_MS}ms pause between requests (65% public / 35% student, GET only)`,
  );

  const results = [];
  const endAt = Date.now() + SECONDS * 1000;
  const started = Date.now();
  await Promise.all(
    Array.from({ length: VUS }, () => worker(endAt, cookies, results)),
  );
  const elapsedSec = (Date.now() - started) / 1000;
  const durations = results.map((row) => row.ms).sort((a, b) => a - b);
  const failed = results.filter((row) => !row.ok);
  const networkFails = failed.filter((row) => row.status === 0);
  const byPath = new Map();
  const byKind = new Map();
  for (const row of results) {
    const current = byPath.get(row.path) || { n: 0, fail: 0, ms: [] };
    current.n += 1;
    current.ms.push(row.ms);
    if (!row.ok) current.fail += 1;
    byPath.set(row.path, current);
    if (!row.ok) {
      byKind.set(row.kind, (byKind.get(row.kind) || 0) + 1);
    }
  }

  console.log("");
  console.log(`Requests   ${results.length}`);
  console.log(`RPS        ${(results.length / elapsedSec).toFixed(1)}`);
  console.log(
    `Failed     ${failed.length} (${((failed.length / Math.max(results.length, 1)) * 100).toFixed(1)}%)${
      networkFails.length
        ? ` — ${networkFails.length} connection errors (server overloaded or stopped)`
        : ""
    }`,
  );
  if (byKind.size) {
    console.log(
      `Errors     ${[...byKind.entries()].map(([kind, n]) => `${kind}=${n}`).join("  ")}`,
    );
  }
  console.log(
    `Latency    p50 ${percentile(durations, 50).toFixed(0)}ms  p95 ${percentile(durations, 95).toFixed(0)}ms  p99 ${percentile(durations, 99).toFixed(0)}ms  max ${durations[durations.length - 1]?.toFixed(0)}ms`,
  );
  console.log("");
  console.log("By path");
  for (const [path, stats] of [...byPath.entries()].sort()) {
    stats.ms.sort((a, b) => a - b);
    console.log(
      `  ${path.padEnd(36)} n=${String(stats.n).padStart(4)}  fail=${stats.fail}  p95=${percentile(stats.ms, 95).toFixed(0)}ms`,
    );
  }

  if (failed.length / Math.max(results.length, 1) > 0.05) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
