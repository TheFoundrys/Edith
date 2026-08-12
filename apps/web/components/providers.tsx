"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
