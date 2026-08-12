import { Router } from "express";
import type { Request, Response } from "express";

export const paymentsRouter = Router();

/** Mock checkout initiate — real Razorpay wiring can replace this. */
paymentsRouter.post("/checkout", async (req: Request, res: Response) => {
  const { programId, amount } = req.body ?? {};
  if (!programId) {
    res.status(400).json({ error: "programId required" });
    return;
  }
  res.json({
    ok: true,
    adapter: process.env.PAYMENT_ADAPTER || "mock",
    orderId: `mock_${Date.now()}`,
    programId,
    amount: Number(amount || 0),
    currency: "INR",
  });
});

paymentsRouter.post("/razorpay/webhook", async (req: Request, res: Response) => {
  console.info("[razorpay-webhook]", JSON.stringify(req.body)?.slice(0, 200));
  res.json({ received: true });
});
