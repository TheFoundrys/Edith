import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { apiRouter } from "../../api/routes/index.js";
import { openApiDocument } from "../../api/openapi.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(
  cors({
    origin: env.webOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

app.use("/api", apiRouter);
app.use("/uploads", express.static(path.resolve(__dirname, "../../uploads")));

if (env.isProd) {
  const dist = path.resolve(__dirname, "../../dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    if (res.headersSent) return;
    const unreachable =
      err.message?.includes("Can't reach database server") ||
      err.name === "PrismaClientInitializationError";
    res.status(unreachable ? 503 : 500).json({
      error: unreachable ? "Database unavailable" : "Internal server error",
    });
  },
);

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("server.ts") ||
    process.argv[1].endsWith("server.js") ||
    process.argv[1].includes("/backend/server"));

if (process.env.VITEST !== "true" && isMain) {
  app.listen(env.apiPort, () => {
    console.info(`[edith-api] listening on :${env.apiPort}`);
  });
}

export { app };
