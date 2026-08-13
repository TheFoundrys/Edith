import { Router } from "express";
import {
  requireAuth,
  requireCapability,
  requireStudent,
  type AuthedRequest,
} from "../../src/backend/middleware/auth.js";
import * as programs from "../../src/backend/services/programs.service.js";
import { asyncHandler } from "../../src/backend/utils/async-handler.js";
import { slugify } from "../../src/shared/utils/string.js";

export const programsRouter = Router();

programsRouter.get(
  "/published",
  asyncHandler(async (_req, res) => {
    const list = await programs.listPublishedPrograms();
    res.json({ programs: list });
  }),
);

programsRouter.get(
  "/slug/:slug",
  asyncHandler(async (req, res) => {
    const program = await programs.getProgramBySlug(req.params.slug);
    if (!program) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ program });
  }),
);

programsRouter.get(
  "/admin",
  requireAuth,
  requireCapability("managePrograms"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const list = await programs.listAdminPrograms(req.user!);
    res.json({ programs: list });
  }),
);

programsRouter.post(
  "/admin",
  requireAuth,
  requireCapability("managePrograms"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const name = String(req.body.name || "").trim();
    if (name.length < 2) {
      res.status(400).json({ error: "Name required" });
      return;
    }
    const slug =
      String(req.body.slug || "").trim() ||
      slugify(name) ||
      `program-${Date.now()}`;
    const program = await programs.createProgram(req.user!, {
      name,
      slug,
      category: req.body.category || "YOUNG_POST_GRADUATE",
      degreeLevel: req.body.degreeLevel || "CERTIFICATE",
      summary: req.body.summary,
      price: req.body.price ?? null,
      tuitionCurrency: req.body.tuitionCurrency || "INR",
      status: req.body.status || "DRAFT",
    });
    res.status(201).json({ program });
  }),
);

programsRouter.get(
  "/enrollments/me",
  requireAuth,
  requireStudent,
  asyncHandler(async (req: AuthedRequest, res) => {
    const enrollments = await programs.listStudentEnrollments(req.user!);
    res.json({ enrollments });
  }),
);

programsRouter.post(
  "/enroll",
  requireAuth,
  requireStudent,
  asyncHandler(async (req: AuthedRequest, res) => {
    const programId = String(req.body.programId || "");
    if (!programId) {
      res.status(400).json({ error: "programId required" });
      return;
    }
    const result = await programs.enrollStudent(req.user!, programId);
    if ("error" in result) {
      res.status(404).json(result);
      return;
    }
    res.json(result);
  }),
);
