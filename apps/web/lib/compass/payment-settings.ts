import "server-only";

import { prisma } from "@/lib/db";

export type CompassPaymentSettingsView = {
  currency: string;
  gstPercent: number;
  convenienceFeePercent: number;
  razorpayEnabled: boolean;
  stripeEnabled: boolean;
  enabled: boolean;
  email: string;
  upiId: string;
  qrCodeUrl: string;
  basePrice: number;
};

type CompassPaymentSettingsRow = {
  enabled: boolean;
  email: string;
  basePrice: number;
  upiId: string;
  qrCodeUrl: string;
};

const DEFAULTS: CompassPaymentSettingsView = {
  currency: "INR",
  gstPercent: 18,
  convenienceFeePercent: 0,
  razorpayEnabled: false,
  stripeEnabled: false,
  enabled: false,
  email: "",
  upiId: "",
  qrCodeUrl: "",
  basePrice: 999,
};

/** Compass `PaymentSettings` is a singleton (no organizationId). */
export async function readCompassPaymentSettings(): Promise<CompassPaymentSettingsView> {
  const rows = await prisma.$queryRaw<CompassPaymentSettingsRow[]>`
    SELECT enabled, email, "basePrice", "upiId", "qrCodeUrl"
    FROM "PaymentSettings"
    ORDER BY "createdAt" ASC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return DEFAULTS;
  return {
    ...DEFAULTS,
    enabled: row.enabled,
    email: row.email,
    basePrice: row.basePrice,
    upiId: row.upiId,
    qrCodeUrl: row.qrCodeUrl,
  };
}
