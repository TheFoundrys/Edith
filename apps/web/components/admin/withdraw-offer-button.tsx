"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdrawProgramOffer } from "@/lib/actions/pricing";
import { Button } from "@/components/ui/button";

export function WithdrawOfferButton({ offerId }: { offerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          await withdrawProgramOffer(offerId);
          router.refresh();
        });
      }}
    >
      {pending ? "Withdrawing…" : "Withdraw"}
    </Button>
  );
}
