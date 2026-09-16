import "server-only";

import { readCompassPaymentSettings } from "@/lib/compass/payment-settings";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";

export type OrganizationPaymentSettings = {
  currency: string;
  gstPercent: number;
  convenienceFeePercent: number;
  razorpayEnabled: boolean;
  stripeEnabled: boolean;
};

/** Org-scoped payment settings on Edith; singleton defaults on Compass. */
export async function getOrganizationPaymentSettings(
  organizationId: string,
): Promise<OrganizationPaymentSettings | null> {
  if (isCompassDatabase()) {
    return readCompassPaymentSettings();
  }

  return prisma.paymentSettings.findUnique({
    where: { organizationId },
    select: {
      currency: true,
      gstPercent: true,
      convenienceFeePercent: true,
      razorpayEnabled: true,
      stripeEnabled: true,
    },
  });
}
