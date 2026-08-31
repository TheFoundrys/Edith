import Link from "next/link";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page";

export const MEMBER_ADMIN_TABS = [
  { value: "people", label: "People", href: "/admin/members" },
  { value: "invites", label: "Staff invites", href: "/admin/members/invites" },
  { value: "groups", label: "Groups", href: "/admin/members/groups" },
  { value: "activity", label: "Activity", href: "/admin/members/activity" },
] as const;

export function MembersAdminHeader({
  title,
  description,
  active,
  counts,
  actions,
  showRolesLink = false,
}: {
  title: string;
  description: string;
  active: (typeof MEMBER_ADMIN_TABS)[number]["value"];
  counts?: Partial<Record<(typeof MEMBER_ADMIN_TABS)[number]["value"], number>>;
  actions?: React.ReactNode;
  showRolesLink?: boolean;
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            {actions}
            {showRolesLink ? (
              <Link
                href="/admin/members/roles"
                className="inline-flex h-9 items-center rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated px-3 text-sm text-fg hover:bg-bg-muted"
              >
                Roles & access
              </Link>
            ) : null}
          </>
        }
      />
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
