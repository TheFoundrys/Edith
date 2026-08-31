"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import {
  createPermissionRole,
  deletePermissionRole,
  updatePermissionRole,
} from "@/lib/actions/roles";

export type PermissionRoleRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  memberCount: number;
};

export function RolesPanel({ roles }: { roles: PermissionRoleRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [deleting, setDeleting] = useState<PermissionRoleRow | null>(null);

  function run(action: () => Promise<{ error?: string }>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        toast({ title: "Could not save", description: result.error, tone: "danger" });
        return;
      }
      toast({ title: successMessage, tone: "success" });
      setCreateOpen(false);
      setName("");
      setDescription("");
      setEditingId(null);
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted max-w-xl">
          Optional labels you can assign to members — for cohorts, teams, or
          programmes. They do not change admin permissions.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateOpen((v) => !v)}
          aria-expanded={createOpen}
        >
          New role
        </Button>
      </div>

      {createOpen ? (
        <Panel className="mb-4 p-4">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () => createPermissionRole(name, description || undefined),
                "Role created",
              );
            }}
          >
            <div className="min-w-[14rem] flex-1">
              <label htmlFor="role-name" className="mb-1.5 block text-xs font-medium text-fg">
                Name
              </label>
              <input
                id="role-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Programme coordinator"
                className="h-9 w-full rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated px-3 text-sm"
              />
            </div>
            <div className="min-w-[14rem] flex-[2]">
              <label
                htmlFor="role-description"
                className="mb-1.5 block text-xs font-medium text-fg"
              >
                Description <span className="font-normal text-fg-muted">(optional)</span>
              </label>
              <input
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this role is for"
                className="h-9 w-full rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated px-3 text-sm"
              />
            </div>
            <Button type="submit" size="sm" loading={pending}>
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
          </form>
        </Panel>
      ) : null}

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-fg-muted">
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Members</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-fg-muted">
                  No custom roles yet.
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium">{role.name}</td>
                  <td className="px-5 py-3 tabular-nums text-fg-muted">
                    {role.memberCount}
                  </td>
                  <td className="px-5 py-3 min-w-[16rem]">
                    {editingId === role.id ? (
                      <form
                        className="flex flex-col gap-2 sm:flex-row sm:items-center"
                        onSubmit={(e) => {
                          e.preventDefault();
                          run(
                            () =>
                              updatePermissionRole(role.id, {
                                description: editDescription || null,
                              }),
                            "Role updated",
                          );
                        }}
                      >
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="h-8 flex-1 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated px-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" loading={pending}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-fg-muted">{role.description ?? "—"}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setEditingId(role.id);
                        setEditDescription(role.description ?? "");
                      }}
                      className="text-sm text-fg underline underline-offset-2 hover:text-fg-muted mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending || role.memberCount > 0}
                      title={
                        role.memberCount > 0
                          ? "Remove from all members first"
                          : undefined
                      }
                      onClick={() => setDeleting(role)}
                      className="text-sm text-fg underline underline-offset-2 hover:text-fg-muted disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Panel>

      <ConfirmDialog
        open={deleting !== null}
        danger
        pending={pending}
        title="Delete role?"
        description={
          deleting
            ? `"${deleting.name}" will be removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          run(() => deletePermissionRole(deleting.id), "Role deleted");
        }}
      />
    </>
  );
}
