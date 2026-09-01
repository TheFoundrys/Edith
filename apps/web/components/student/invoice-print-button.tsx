"use client";

import { Button } from "@/components/ui/button";

export function InvoicePrintButton() {
  return (
    <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
      Print / Save PDF
    </Button>
  );
}
