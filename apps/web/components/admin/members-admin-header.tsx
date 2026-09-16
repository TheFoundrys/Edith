import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";
import { Tabs } from "@/components/ui/tabs";

export const MEMBER_ADMIN_TABS = [
  { value: "people", label: "People", href: "/admin/members" },
  { value: "invites", label: "Staff invites", href: "/admin/members/invites" },
  { value: "groups", label: "Groups", href: "/admin/members/groups" },
  { value: "activity", label: "Activity", href: "/admin/members/activity" },
] as const;

export function MembersAdminHeader({
  description,
  active,
  counts,
  actions,
  showRolesLink = false,
}: {
  description: string;
  active: (typeof MEMBER_ADMIN_TABS)[number]["value"];
  counts?: Partial<Record<(typeof MEMBER_ADMIN_TABS)[number]["value"], number>>;
  actions?: React.ReactNode;
  showRolesLink?: boolean;
}) {
  const people = counts?.people ?? 0;
  const invites = counts?.invites ?? 0;
  const groups = counts?.groups ?? 0;

  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        People · Invite → Access → Groups
      </p>
      <PageHeader
        title="People"
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {showRolesLink ? (
              <Link href="/admin/members/roles">
                <Button variant="secondary" size="sm">
                  Roles & access
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="peak-stats">
        <div className="peak-stat">
          <p className="peak-stat-label">Members</p>
          <p className="peak-stat-value">{people}</p>
        </div>
        <div className="peak-stat">
          <p className="peak-stat-label">Pending invites</p>
          <p className="peak-stat-value">{invites}</p>
        </div>
        <div className="peak-stat">
          <p className="peak-stat-label">Groups</p>
          <p className="peak-stat-value">{groups}</p>
        </div>
      </div>

      <div className="mb-[var(--grid-pad)]">
        <Tabs
          items={MEMBER_ADMIN_TABS.map((tab) => ({
            value: tab.value,
            label: tab.label,
            count: counts?.[tab.value],
          }))}
          active={active}
          hrefFor={(value) =>
            MEMBER_ADMIN_TABS.find((tab) => tab.value === value)?.href ??
            "/admin/members"
          }
          label="User management"
        />
      </div>
    </div>
  );
}
