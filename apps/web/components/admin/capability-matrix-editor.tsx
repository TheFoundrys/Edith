"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo, useTransition } from "react";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import {
  resetStaffRoleCapabilities,
  setStaffRoleCapabilities,
} from "@/lib/actions/capabilities";
import {
  CAPABILITY_GROUPS,
  CAPABILITY_LABELS,
  ROLE_LABELS,
  ROLE_SHORT_LABELS,
  STAFF_PERMISSION_ROLES,
  type AppRole,
  type Capability,
} from "@/lib/auth/capability-labels";

export function CapabilityMatrixEditor({
  matrix,
}: {
  matrix: Record<AppRole, Capability[]>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const matrixMap = useMemo(
    () =>
      new Map(
        STAFF_PERMISSION_ROLES.map((role) => [role, new Set(matrix[role] ?? [])]),
      ),
    [matrix],
  );

  function toggle(role: AppRole, cap: Capability) {
    const current = new Set(matrixMap.get(role) ?? []);
    if (current.has(cap)) current.delete(cap);
    else current.add(cap);

    startTransition(async () => {
      const result = await setStaffRoleCapabilities(role, [...current]);
      if (result?.error) {
        toast({ title: "Could not save", description: result.error, tone: "danger" });
        return;
      }
      toast({ title: "Permissions updated", tone: "success" });
      router.refresh();
    });
  }

  function reset(role: AppRole) {
    startTransition(async () => {
      const result = await resetStaffRoleCapabilities(role);
      if (result?.error) {
        toast({ title: "Could not reset", description: result.error, tone: "danger" });
        return;
      }
      toast({ title: `${ROLE_LABELS[role]} reset`, tone: "success" });
      router.refresh();
    });
  }

  return (
    <Panel className="overflow-x-auto">
      <p className="border-b border-border px-4 py-3 text-sm text-fg-muted">
        Every staff role can open the dashboard. Grant edit rights per module
        below. Restricted cells have no write access.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-fg-muted">
            <th className="px-4 py-3 font-medium">Module &amp; security scope</th>
            {STAFF_PERMISSION_ROLES.map((role) => (
              <th key={role} className="px-3 py-3 font-medium">
                <div>{ROLE_SHORT_LABELS[role]}</div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => reset(role)}
                  className="mt-0.5 text-[11px] text-fg-muted underline underline-offset-2 hover:text-fg disabled:opacity-50"
                >
                  Reset
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CAPABILITY_GROUPS.map((group) => (
            <Fragment key={group.label}>
              <tr className="bg-bg">
                <td
                  className="px-4 py-2 text-[0.6875rem] font-bold uppercase tracking-wider text-fg-muted"
                  colSpan={STAFF_PERMISSION_ROLES.length + 1}
                >
                  {group.label}
                </td>
              </tr>
              {group.capabilities.map((cap) => (
                <tr key={cap} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-fg">{CAPABILITY_LABELS[cap]}</td>
                  {STAFF_PERMISSION_ROLES.map((role) => {
                    const checked = matrixMap.get(role)?.has(cap) ?? false;
                    return (
                      <td key={role} className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={pending}
                          aria-label={`${ROLE_LABELS[role]} — ${CAPABILITY_LABELS[cap]}`}
                          onChange={() => toggle(role, cap)}
                          className="h-4 w-4 rounded border-border-strong accent-accent"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
