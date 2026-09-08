import { Panel } from "@/components/ui/page";
import {
  ROLE_LABELS,
  ROLE_PROFILES,
  STAFF_PERMISSION_ROLES,
  type AppRole,
} from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const AUTHORITY_CLASS: Record<string, string> = {
  full: "text-emerald-600",
  high: "text-emerald-600",
  medium: "text-amber-600",
  limited: "text-fg-muted",
};

const BAR_CLASS: Record<string, string> = {
  full: "bg-emerald-500",
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  limited: "bg-slate-500",
};

export function StaffRoleCards({
  counts,
}: {
  counts: Partial<Record<AppRole, number>>;
}) {
  return (
    <div className="mb-[var(--grid-pad)] grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {STAFF_PERMISSION_ROLES.map((role) => {
        const profile = ROLE_PROFILES[role];
        const count = counts[role] ?? 0;
        return (
          <Panel key={role} className="flex flex-col justify-between p-3.5">
            <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-fg-muted">
              {count} {count === 1 ? "user" : "users"}
            </p>
            <h3 className="my-2 text-sm font-bold leading-tight text-fg">
              {ROLE_LABELS[role]}
            </h3>
            <div className="flex flex-col gap-1 border-t border-border pt-2">
              <div className="flex items-center justify-between text-[0.6875rem]">
                <span className="font-semibold uppercase text-fg-muted">
                  Authority Level
                </span>
                <span
                  className={cn(
                    "font-bold",
                    AUTHORITY_CLASS[profile.authorityTone],
                  )}
                >
                  {profile.authority}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-1 text-[0.6875rem] font-medium text-fg">
                  {profile.domain}
                </span>
                <div className="flex items-center gap-0.5" aria-hidden>
                  {Array.from({ length: 4 }, (_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "h-3 w-1.5 rounded-[1px]",
                        index < profile.bars
                          ? BAR_CLASS[profile.authorityTone]
                          : "bg-border",
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="pt-1 text-[0.6875rem] leading-snug text-fg-muted">
                {profile.description}
              </p>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
