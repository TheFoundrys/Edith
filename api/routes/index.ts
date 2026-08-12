import { Router } from "express";
import { authRouter } from "./auth.js";
import { programsRouter } from "./programs.js";
import { compassRouter } from "./compass.js";
import { paymentsRouter } from "./payments.js";
import { crmRouter } from "./crm.js";
import { uploadsRouter } from "./uploads.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "edith-api" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/programs", programsRouter);
apiRouter.use("/modules", compassRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/crm", crmRouter);
apiRouter.use("/uploads", uploadsRouter);
