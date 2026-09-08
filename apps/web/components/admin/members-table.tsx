"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dropdown,
  DropdownCheckboxItem,
} from "@/components/ui/dropdown";
import { Input, Label } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { InviteStaffPanel } from "@/components/admin/invite-staff-panel";
import {
  addMember,
  bulkSetExpiry,
  bulkSetMemberStatus,
  removeMembers,
  setMemberExpiry,
  setMemberRoles,
  setMemberStaffRole,
  setMemberStatus,
} from "@/lib/actions/members";
import { ROLE_LABELS, STAFF_ROLES, type AppRole } from "@/lib/auth/roles";
import {
  accessExpiryLabel,
  isExpired,
  toDateInputValue,
} from "@/lib/members/access";
import type { MembershipAccessState } from "@/lib/members/status";

export type MemberRow = {
  kind: "member";
  id: string;
  name: string;
  email: string;
  programs: number;
  expiresAt: string | null;
  roleIds: string[];
  enumRole: string;
  status: "ACTIVE" | "SUSPENDED";
  accessState: MembershipAccessState;
  isSelf: boolean;
};

type PermissionRoleOption = { id: string; name: string };

const STAFF_ACCESS_OPTIONS: AppRole[] = [...STAFF_ROLES, "STUDENT"];

const cellClass = "px-5 py-3 align-middle";
const dateInputClass =
  "h-8 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated px-2 text-sm text-fg";

function statusBadge(state: MembershipAccessState) {
  if (state === "suspended") return { tone: "danger" as const, label: "Suspended" };
  if (state === "expired") return { tone: "warning" as const, label: "Expired" };
  return { tone: "success" as const, label: "Active" };
}

export function MembersTable({
  rows,
  assignableRoles,
  rolesSetupHref,
  canInviteAdmins,
  footer,
}: {
  rows: MemberRow[];
  assignableRoles: PermissionRoleOption[];
  rolesSetupHref?: string;
  canInviteAdmins: boolean;
  footer?: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<
    { ids: string[]; label: string } | null
  >(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachEmail, setAttachEmail] = useState("");

  const selectableIds = useMemo(
    () => rows.filter((row) => !row.isSelf).map((row) => row.id),
    [rows],
  );
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const roleNameById = useMemo(
    () => new Map(assignableRoles.map((role) => [role.id, role.name])),
    [assignableRoles],
  );
  const assignableRoleIds = useMemo(
    () => new Set(assignableRoles.map((role) => role.id)),
    [assignableRoles],
  );

  function customRoleIds(row: MemberRow) {
    return row.roleIds.filter((id) => assignableRoleIds.has(id));
  }

  function roleSummary(row: MemberRow) {
    const ids = customRoleIds(row);
    if (ids.length === 0) return "None";
    if (ids.length === 1) return roleNameById.get(ids[0]) ?? "1 role";
    return `${ids.length} roles`;
  }

  function run(
    action: () => Promise<{ error?: string; ok?: true }>,
    successMessage?: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast({ title: "Could not save", description: result.error, tone: "danger" });
        return;
      }
      if (successMessage) toast({ title: successMessage, tone: "success" });
      router.refresh();
    });
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const selectedIds = [...selected];

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setInviteOpen((open) => !open);
              setAttachOpen(false);
            }}
            aria-expanded={inviteOpen}
          >
            Invite staff
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setAttachOpen((open) => !open);
              setInviteOpen(false);
            }}
            aria-expanded={attachOpen}
          >
            Add existing student
          </Button>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-fg-muted tabular-nums">
              {selectedIds.length} selected
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => {
                run(() => bulkSetMemberStatus(selectedIds, "SUSPENDED"), "Members suspended");
                clearSelection();
              }}
            >
              Suspend
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => {
                run(() => bulkSetMemberStatus(selectedIds, "ACTIVE"), "Members restored");
                clearSelection();
              }}
            >
              Restore
            </Button>
            <label className="flex items-center gap-1.5">
              <span className="text-fg-muted">Set expiry</span>
              <input
                type="date"
                className={dateInputClass}
                disabled={pending}
                onChange={(event) => {
                  const value = event.target.value;
                  if (!value) return;
                  run(
                    () => bulkSetExpiry(selectedIds, value),
                    `Expiry set for ${selectedIds.length} member${selectedIds.length === 1 ? "" : "s"}`,
                  );
                  clearSelection();
                }}
              />
            </label>
            <Button
              variant="danger"
              size="sm"
              disabled={pending}
              onClick={() =>
                setConfirming({
                  ids: selectedIds,
                  label: `${selectedIds.length} member${selectedIds.length === 1 ? "" : "s"}`,
                })
              }
            >
              Remove
            </Button>
          </div>
        ) : null}
      </div>

      {inviteOpen ? <InviteStaffPanel canInviteAdmins={canInviteAdmins} /> : null}

      {attachOpen ? (
        <Panel className="mb-3 p-4">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const email = attachEmail.trim();
              if (!email) return;
              run(() => addMember(email), "Existing student added");
              setAttachEmail("");
              setAttachOpen(false);
            }}
          >
            <div className="min-w-[16rem] flex-1">
              <Label htmlFor="attach-email">Existing student email</Label>
              <Input
                id="attach-email"
                type="email"
                required
                value={attachEmail}
                onChange={(event) => setAttachEmail(event.target.value)}
              />
            </div>
            <Button type="submit" size="sm" loading={pending}>
              Add
            </Button>
          </form>
          <p className="mt-2 text-xs text-fg-muted">
            Use this only for a student account that already exists. Staff must be invited.
          </p>
        </Panel>
      ) : null}

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Organization members with access, labels, and expiry
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-fg-muted">
              <th scope="col" className="w-10 px-5 py-3 font-medium">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={selectableIds.length === 0 || pending}
                  onChange={(event) =>
                    setSelected(event.target.checked ? new Set(selectableIds) : new Set())
                  }
                  aria-label="Select all members on this page"
                />
              </th>
              <th scope="col" className="px-5 py-3 font-medium">Account</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
              <th scope="col" className="px-5 py-3 font-medium">Access</th>
              <th scope="col" className="px-5 py-3 font-medium">Labels</th>
              <th scope="col" className="px-5 py-3 font-medium">Expires</th>
              <th scope="col" className="px-5 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const badge = statusBadge(row.accessState);
              return (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className={cellClass}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      disabled={row.isSelf || pending}
                      onChange={(event) => toggleRow(row.id, event.target.checked)}
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                  <td className={cellClass}>
                    <p className="font-medium">
                      {row.name}
                      {row.isSelf ? <Badge tone="neutral" className="ml-2">You</Badge> : null}
                    </p>
                    <p className="text-xs text-fg-muted">{row.email}</p>
                    <p className="text-xs text-fg-muted">{row.programs} enrolled programs</p>
                  </td>
                  <td className={cellClass}>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className={`${cellClass} min-w-[14rem]`}>
                    <select
                      className="h-8 w-full max-w-[16rem] rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated px-2 text-sm"
                      value={row.enumRole}
                      disabled={pending || (row.isSelf && row.enumRole === "SUPER_ADMIN")}
                      aria-label={`Staff access for ${row.name}`}
                      onChange={(event) =>
                        run(() => setMemberStaffRole(row.id, event.target.value))
                      }
                    >
                      {STAFF_ACCESS_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={`${cellClass} min-w-[12rem]`}>
                    {assignableRoles.length === 0 ? (
                      rolesSetupHref ? (
                        <Link
                          href={rolesSetupHref}
                          className="text-xs text-fg-muted underline underline-offset-2"
                        >
                          Set up roles
                        </Link>
                      ) : (
                        <span className="text-xs text-fg-muted">—</span>
                      )
                    ) : (
                      <Dropdown
                        label={roleSummary(row)}
                        disabled={pending}
                        ariaLabel={`Labels for ${row.name}`}
                        panelClassName="w-56"
                      >
                        {assignableRoles.map((role) => (
                          <DropdownCheckboxItem
                            key={role.id}
                            checked={customRoleIds(row).includes(role.id)}
                            disabled={pending}
                            onChange={(checked) => {
                              const custom = customRoleIds(row);
                              const systemIds = row.roleIds.filter(
                                (id) => !assignableRoleIds.has(id),
                              );
                              const nextCustom = checked
                                ? [...custom, role.id]
                                : custom.filter((id) => id !== role.id);
                              run(() =>
                                setMemberRoles(row.id, [...systemIds, ...nextCustom]),
                              );
                            }}
                          >
                            {role.name}
                          </DropdownCheckboxItem>
                        ))}
                      </Dropdown>
                    )}
                  </td>
                  <td className={cellClass}>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        className={dateInputClass}
                        value={toDateInputValue(row.expiresAt)}
                        disabled={pending}
                        aria-label={`Access expiry for ${row.name}`}
                        onChange={(event) =>
                          run(() => setMemberExpiry(row.id, event.target.value || null))
                        }
                      />
                      {row.expiresAt ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => setMemberExpiry(row.id, null))}
                          aria-label={`Clear expiry for ${row.name}`}
                          className="text-fg-muted hover:text-fg"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                    <p className={`mt-1 text-xs ${isExpired(row.expiresAt) ? "text-fg" : "text-fg-muted"}`}>
                      {accessExpiryLabel(row.expiresAt)}
                    </p>
                  </td>
                  <td className={`${cellClass} text-right`}>
                    {row.isSelf ? (
                      <span className="text-xs text-fg-muted">—</span>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(
                              () =>
                                setMemberStatus(
                                  row.id,
                                  row.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
                                ),
                              row.status === "SUSPENDED" ? "Access restored" : "Member suspended",
                            )
                          }
                          className="text-sm text-fg underline underline-offset-2 hover:text-fg-muted"
                        >
                          {row.status === "SUSPENDED" ? "Restore" : "Suspend"}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setConfirming({ ids: [row.id], label: row.name })}
                          className="text-sm text-fg-muted underline underline-offset-2 hover:text-fg"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {footer ? <div className="border-t border-border">{footer}</div> : null}
      </Panel>

      <ConfirmDialog
        open={confirming !== null}
        danger
        pending={pending}
        title="Remove from organization?"
        description={
          confirming
            ? `${confirming.label} will lose access immediately. Their account and learning history stay intact.`
            : undefined
        }
        confirmLabel="Remove"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          const ids = confirming?.ids ?? [];
          setConfirming(null);
          if (ids.length === 0) return;
          run(
            () => removeMembers(ids),
            `Removed ${ids.length} member${ids.length === 1 ? "" : "s"}`,
          );
          clearSelection();
        }}
      />
    </>
  );
}