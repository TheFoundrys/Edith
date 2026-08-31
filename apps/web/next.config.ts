import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Without this the workspace root above `apps/` becomes the tracing root and
  // standalone lands in `.next/standalone/apps/web`, which the image can't find.
  outputFileTracingRoot: path.join(__dirname),
  // Production builds run on Turbopack (the Next 16 default); the webpack block
  // below only applies to `next dev --webpack`.
  turbopack: {},
  // SQLite mutates on reads/writes; if the watcher sees prisma/*.db the
  // page reloads forever. Use `next dev --webpack` so these paths can be ignored
  // (Turbopack in this Next version has no ignore API).
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/prisma/**/*.db",
          "**/prisma/**/*.db-*",
          "**/prisma/**/*.db-journal",
          "**/uploads/**",
        ],
      };
    }
    return config;
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const scriptPolicy =
      isProduction
        ? "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com";
    const contentSecurityPolicy = [
      "default-src 'self'",
      scriptPolicy,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      isProduction
        ? "connect-src 'self' https://*.razorpay.com"
        : "connect-src 'self' ws: wss: https://*.razorpay.com",
      "frame-src https://*.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(isProduction ? ["upgrade-insecure-requests"] : []),
    ].join("; ");
    const securityHeaders = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      ...(isProduction
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains",
            },
          ]
        : []),
    ];
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/programs", destination: "/courses", permanent: false },
      {
        source: "/programs/:slug",
        destination: "/courses/:slug",
        permanent: false,
      },
      {
        source: "/courses/edith-personality-profile",
        destination: "/personality-profile",
        permanent: false,
      },
      { source: "/student", destination: "/student/dashboard", permanent: false },
      {
        source: "/student/order",
        destination: "/student/enroll",
        permanent: false,
      },
      {
        source: "/student/checkout",
        destination: "/student/payment",
        permanent: false,
      },
      {
        source: "/student/programs",
        destination: "/courses",
        permanent: false,
      },
      {
        source: "/student/learn",
        destination: "/student/my-courses",
        permanent: false,
      },
      {
        source: "/student/learn/:courseId",
        destination: "/student/learning/:courseId",
        permanent: false,
      },
      {
        source: "/student/learn/:courseId/lessons/:lessonId",
        destination: "/student/learning/:courseId/lessons/:lessonId",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
