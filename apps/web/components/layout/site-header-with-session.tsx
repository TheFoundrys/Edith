import "server-only";

import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { SiteHeader, type SiteHeaderProps } from "@/components/layout/home-header";

type SiteHeaderWithSessionProps = Omit<
  SiteHeaderProps,
  "loggedIn" | "workspaceHref" | "workspaceLabel"
>;

export async function SiteHeaderWithSession(props: SiteHeaderWithSessionProps) {
  const session = await auth();
  const loggedIn =
    Boolean(session?.user?.id) && session?.error !== "InvalidSession";

  return (
    <SiteHeader
      {...props}
      loggedIn={loggedIn}
      workspaceHref={
        loggedIn
          ? isStaffRole(session!.user.role)
            ? "/admin"
            : "/student/dashboard"
          : undefined
      }
      workspaceLabel={
        loggedIn
          ? isStaffRole(session!.user.role)
            ? "Workspace"
            : "Continue learning"
          : undefined
      }
    />
  );
}
