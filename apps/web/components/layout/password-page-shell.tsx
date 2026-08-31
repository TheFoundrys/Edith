import "server-only";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeaderWithSession } from "@/components/layout/site-header-with-session";

export async function PasswordPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col bg-bg">
      <SiteHeaderWithSession variant="sticky" />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
