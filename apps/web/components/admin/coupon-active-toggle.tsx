"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCouponActive } from "@/lib/actions/pricing";
import { Button } from "@/components/ui/button";

export function CouponActiveToggle({
  couponId,
  isActive,
}: {
  couponId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant={isActive ? "secondary" : "primary"}
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          await setCouponActive(couponId, !isActive);
          router.refresh();
        });
      }}
    >
      {pending ? "Updating…" : isActive ? "Pause" : "Activate"}
    </Button>
  );
}
