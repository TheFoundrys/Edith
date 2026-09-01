"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropdown, DropdownCheckboxItem } from "@/components/ui/dropdown";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import {
  createGroup,
  deleteGroup,
  setGroupArchived,
  setGroupMembers,
  updateGroup,
} from "@/lib/actions/groups";

export type GroupMemberOption = { id: string; name: string; email: string };

export type AdminGroupRow = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isArchived: boolean;
  memberIds: string[];
};

export function GroupsManager({
  groups,
  memberOptions,
}: {
  groups: AdminGroupRow[];
  memberOptions: GroupMemberOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleting, setDeleting] = useState<AdminGroupRow | null>(null);

  const memberNameById = useMemo(
    () => new Map(memberOptions.map((member) => [member.id, member.name])),
    [memberOptions],
  );

  function run(action: () => Promise<{ error?: string; ok?: true }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast({ title: "Could not save", description: result.error, tone: "danger" });
        return;
      }
      toast({ title: success, tone: "success" });
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
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen((open) => !open)}>
          New group
        </Button>
      </div>
      {createOpen ? (
        <Panel className="mb-4 p-4">
          <form
            className="grid gap-3 md:grid-cols-[1fr_2fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => createGroup({ name, description }), "Group created");
            }}
          >
            <div>
              <Label htmlFor="group-name">Name</Label>
              <Input id="group-name" required value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="group-description">Description</Label>
              <Input
                id="group-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" size="sm" loading={pending}>
                Create
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="space-y-3">
        {groups.length === 0 ? (
          <p className="text-sm text-fg-muted">
            No groups yet. Create one to organize staff or student cohorts. Membership in the
            organization does not change.
          </p>
        ) : null}
        {groups.map((group) => (
          <Panel key={group.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {group.name}
                  {group.isArchived ? <Badge tone="neutral" className="ml-2">Archived</Badge> : null}
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  {group.description || `${group.memberCount} member${group.memberCount === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(group.id);
                    setEditName(group.name);
                    setEditDescription(group.description);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => setGroupArchived(group.id, !group.isArchived),
                      group.isArchived ? "Group restored" : "Group archived",
                    )
                  }
                >
                  {group.isArchived ? "Restore" : "Archive"}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleting(group)}>
                  Delete
                </Button>
              </div>
            </div>

            {editingId === group.id ? (
              <form
                className="mt-4 grid gap-3 md:grid-cols-[1fr_2fr_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  run(
                    () => updateGroup(group.id, { name: editName, description: editDescription }),
                    "Group updated",
                  );
                }}
              >
                <div>
                  <Label htmlFor={`edit-name-${group.id}`}>Name</Label>
                  <Input
                    id={`edit-name-${group.id}`}
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`edit-description-${group.id}`}>Description</Label>
                  <Textarea
                    id={`edit-description-${group.id}`}
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" size="sm" loading={pending}>
                    Save
                  </Button>
                </div>
              </form>
            ) : null}

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-fg">Members</p>
              <Dropdown
                label={
                  group.memberIds.length === 0
                    ? "Assign members"
                    : `${group.memberIds.length} assigned`
                }
                disabled={pending}
                ariaLabel={`Members of ${group.name}`}
                panelClassName="w-72 max-h-72 overflow-y-auto"
              >
                {memberOptions.length === 0 ? (
                  <p className="px-2 py-1.5 text-sm text-fg-muted">No members to assign yet.</p>
                ) : (
                  memberOptions.map((member) => (
                    <DropdownCheckboxItem
                      key={member.id}
                      checked={group.memberIds.includes(member.id)}
                      disabled={pending}
                      onChange={(checked) => {
                        const next = checked
                          ? [...group.memberIds, member.id]
                          : group.memberIds.filter((id) => id !== member.id);
                        run(() => setGroupMembers(group.id, next), "Group members updated");
                      }}
                    >
                      {member.name}
                      <span className="ml-2 text-xs text-fg-muted">{member.email}</span>
                    </DropdownCheckboxItem>
                  ))
                )}
              </Dropdown>
              {group.memberIds.length > 0 ? (
                <p className="mt-2 text-xs text-fg-muted">
                  {group.memberIds
                    .slice(0, 6)
                    .map((id) => memberNameById.get(id) ?? "Member")
                    .join(", ")}
                  {group.memberIds.length > 6 ? ` +${group.memberIds.length - 6}` : ""}
                </p>
              ) : null}
            </div>
          </Panel>
        ))}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        danger
        pending={pending}
        title="Delete this group?"
        description="Members stay in the organization. Only the group and its assignments are removed."
        confirmLabel="Delete group"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          run(() => deleteGroup(deleting.id), "Group deleted");
        }}
      />
    </>
  );
}
