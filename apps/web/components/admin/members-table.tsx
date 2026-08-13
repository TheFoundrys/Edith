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
  DropdownSeparator,
} from "@/components/ui/dropdown";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import {
  addMember,
  bulkSetExpiry,
  removeMembers,
  setMemberExpiry,
  setMemberRoles,
} from "@/lib/actions/members";
import { roleLabel } from "@/lib/auth/roles";
import {
  accessExpiryLabel,
  isExpired,
  toDateInputValue,
} from "@/lib/members/access";

export type MemberRow = {
  kind: "member";
  id: string;
  name: string;
  email: string;
  programs: number;
  /** ISO string so the server component can pass it across the boundary. */
  expiresAt: string | null;
  roleIds: string[];
  enumRole: string;
  isSelf: boolean;
};

export type GroupRow = {
  kind: "group";
  id: string;
  name: string;
  subtitle: string;
  programs: number;
  isArchived: boolean;
};

export type MemberTableRow = MemberRow | GroupRow;

type PermissionRoleOption = { id: string; name: string };

const cellClass = "px-5 py-3 align-middle";
const dateInputClass =
  "h-8 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated px-2 text-sm text-fg";

export function MembersTable({
  rows,
  permissionRoles,
  footer,
}: {
  rows: MemberTableRow[];
  permissionRoles: PermissionRoleOption[];
  /**
   * Pagination is rendered on the server and handed over as a slot, because the
   * link builders it needs are functions and those cannot cross the RSC boundary.
   */
  footer?: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<
    { ids: string[]; label: string } | null
  >(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");

  const memberRows = useMemo(
    () => rows.filter((r): r is MemberRow => r.kind === "member"),
    [rows],
  );
  const selectableIds = useMemo(
    () => memberRows.filter((r) => !r.isSelf).map((r) => r.id),
    [memberRows],
  );
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const roleNameById = useMemo(
    () => new Map(permissionRoles.map((r) => [r.id, r.name])),
    [permissionRoles],
  );

  /** Runs an action, surfacing its error as a toast and refreshing on success. */
  function run(action: () => Promise<{ error?: string }>, successMessage?: string) {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
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

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(selectableIds) : new Set());
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function roleSummary(row: MemberRow) {
    if (row.roleIds.length === 0) return "No roles";
    if (row.roleIds.length === 1) {
      return roleNameById.get(row.roleIds[0]) ?? "1 role";
    }
    return "Multiple roles";
  }

  const selectedIds = [...selected];

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAddOpen((v) => !v)}
            aria-expanded={addOpen}
          >
            Add member
          </Button>
          <Link
            href="/admin/roles"
            className="text-sm text-fg-muted underline underline-offset-2 hover:text-fg"
          >
            Edit roles
          </Link>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-fg-muted tabular-nums">
              {selectedIds.length} selected
            </span>
            <label className="flex items-center gap-1.5">
              <span className="text-fg-muted">Set expiry</span>
              <input
                type="date"
                className={dateInputClass}
                disabled={pending}
                onChange={(e) => {
                  const value = e.target.value;
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
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => {
                run(() => bulkSetExpiry(selectedIds, null), "Expiry cleared");
                clearSelection();
              }}
            >
              Clear expiry
            </Button>
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

      {addOpen ? (
        <Panel className="mb-3 p-4">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const email = addEmail.trim();
              if (!email) return;
              startTransition(async () => {
                const result = await addMember(email);
                if (result?.error) {
                  toast({
                    title: "Could not add member",
                    description: result.error,
                    tone: "danger",
                  });
                  return;
                }
                toast({ title: "Member added", tone: "success" });
                setAddEmail("");
                setAddOpen(false);
                router.refresh();
              });
            }}
          >
            <div className="flex-1 min-w-[16rem]">
              <label
                htmlFor="add-member-email"
                className="mb-1.5 block text-xs font-medium text-fg"
              >
                Email of an existing account
              </label>
              <input
                id="add-member-email"
                type="email"
                required
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="person@example.com"
                className="h-9 w-full rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated px-3 text-sm"
              />
            </div>
            <Button type="submit" size="sm" loading={pending}>
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
          </form>
          <p className="mt-2 text-xs text-fg-muted">
            Joins as a student, then grant access with roles. Accounts sign up first.
          </p>
        </Panel>
      ) : null}

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Organization members and groups, with roles and access expiry
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-fg-muted">
              <th scope="col" className="w-10 px-5 py-3 font-medium">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={selectableIds.length === 0 || pending}
                  onChange={(e) => toggleAll(e.target.checked)}
                  aria-label="Select all members on this page"
                />
              </th>
              <th scope="col" className="px-5 py-3 font-medium">Account</th>
              <th scope="col" className="px-5 py-3 font-medium">Programs</th>
              <th scope="col" className="px-5 py-3 font-medium">Access expires</th>
              <th scope="col" className="px-5 py-3 font-medium">Role</th>
              <th scope="col" className="px-5 py-3 font-medium">Expiration</th>
              <th scope="col" className="px-5 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              row.kind === "group" ? (
                <tr key={`group-${row.id}`} className="border-b border-border last:border-0">
                  <td className={cellClass} />
                  <td className={cellClass}>
                    <p className="font-medium">
                      {row.name}
                      <Badge tone="info" className="ml-2">Group</Badge>
                      {row.isArchived ? (
                        <Badge tone="neutral" className="ml-1">Archived</Badge>
                      ) : null}
                    </p>
                    <p className="text-xs text-fg-muted">{row.subtitle}</p>
                  </td>
                  <td className={`${cellClass} tabular-nums text-fg-muted`}>
                    {row.programs}
                  </td>
                  <td colSpan={4} className={`${cellClass} text-xs text-fg-muted`}>
                    Groups carry no roles or expiry of their own.
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className={cellClass}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      disabled={row.isSelf || pending}
                      onChange={(e) => toggleRow(row.id, e.target.checked)}
                      aria-label={`Select ${row.name}`}
                    />
                  </td>

                  <td className={cellClass}>
                    <p className="font-medium">
                      {row.name}
                      {row.isSelf ? (
                        <Badge tone="neutral" className="ml-2">You</Badge>
                      ) : null}
                    </p>
                    <p className="text-xs text-fg-muted">{row.email}</p>
                  </td>

                  <td className={`${cellClass} tabular-nums text-fg-muted`}>
                    {row.programs}
                  </td>

                  <td className={cellClass}>
                    <span
                      className={
                        isExpired(row.expiresAt) ? "text-fg" : "text-fg-muted"
                      }
                    >
                      {accessExpiryLabel(row.expiresAt)}
                    </span>
                    <span className="ml-2 text-xs text-fg-muted">
                      {roleLabel(row.enumRole)}
                    </span>
                  </td>

                  <td className={`${cellClass} min-w-[12rem]`}>
                    {permissionRoles.length === 0 ? (
                      <Link
                        href="/admin/roles"
                        className="text-xs text-fg-muted underline underline-offset-2"
                      >
                        No roles defined
                      </Link>
                    ) : (
                      <Dropdown
                        label={roleSummary(row)}
                        disabled={pending}
                        ariaLabel={`Roles for ${row.name}`}
                        panelClassName="w-56"
                      >
                        {permissionRoles.map((role) => (
                          <DropdownCheckboxItem
                            key={role.id}
                            checked={row.roleIds.includes(role.id)}
                            disabled={pending}
                            onChange={(checked) => {
                              const next = checked
                                ? [...row.roleIds, role.id]
                                : row.roleIds.filter((id) => id !== role.id);
                              run(() => setMemberRoles(row.id, next));
                            }}
                          >
                            {role.name}
                          </DropdownCheckboxItem>
                        ))}
                        <DropdownSeparator />
                        <Link
                          href="/admin/roles"
                          className="block px-2 py-1.5 text-sm text-fg-muted underline underline-offset-2 hover:text-fg"
                        >
                          Edit roles
                        </Link>
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
                        onChange={(e) =>
                          run(() => setMemberExpiry(row.id, e.target.value || null))
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
                  </td>

                  <td className={`${cellClass} text-right`}>
                    {row.isSelf ? (
                      <span className="text-xs text-fg-muted">—</span>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          setConfirming({ ids: [row.id], label: row.name })
                        }
                        className="text-sm text-fg underline underline-offset-2 hover:text-fg-muted"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ),
            )}
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
