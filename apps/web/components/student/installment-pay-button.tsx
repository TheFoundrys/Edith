"use client";

import { useState, useTransition } from "react";
import {
  completeMockInstallmentPayment,
  startInstallmentPayment,
} from "@/lib/actions/installments";
import { Button } from "@/components/ui/button";

export function InstallmentPayButton({
  installmentId,
  label = "Pay installment",
}: {
  installmentId: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        loading={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const order = await startInstallmentPayment(installmentId);
            if ("error" in order && order.error) {
              setError(order.error);
              return;
            }
            if (order.provider === "MOCK" && order.paymentId) {
              const result = await completeMockInstallmentPayment(order.paymentId);
              if (result.error) setError(result.error);
              else window.location.reload();
              return;
            }
            const checkout = order.checkout as { mode?: string; url?: string };
            if (checkout.mode === "stripe_redirect" && checkout.url) {
              window.location.href = checkout.url;
              return;
            }
            setError("Online payment is not configured for installments yet.");
          });
        }}
      >
        {label}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
