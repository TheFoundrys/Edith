import { AppShell } from "@/components/layout/app-shell";
import { staffNavFor, roleLabel } from "@/lib/auth/roles";
import { requireStaff } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/brand";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();
  const nav = staffNavFor(session.user.role).map(({ href, label }) => ({
    href,
    label,
  }));

  return (
    <AppShell
      brand={APP_NAME}
      nav={nav}
      user={{
        name: session.user.name,
        email: session.user.email,
        role: roleLabel(session.user.role),
      }}
    >
      {children}
    </AppShell>
  );
}
