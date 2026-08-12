import { Router } from "express";
import type { Request, Response } from "express";

export const crmRouter = Router();

crmRouter.post("/enrollment-callback", async (req: Request, res: Response) => {
  console.info("[crm-enrollment-callback]", JSON.stringify(req.body)?.slice(0, 300));
  res.json({ ok: true });
});
