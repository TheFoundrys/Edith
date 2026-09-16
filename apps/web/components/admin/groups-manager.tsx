"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropdown, DropdownCheckboxItem } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
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
          {createOpen ? "Close" : "New group"}
        </Button>
      </div>
      {createOpen ? (
        <Panel className="mb-[var(--grid-pad)] p-[var(--grid-pad)]">
          <h2 className="font-display text-lg text-fg">New group</h2>
          <p className="mt-1 mb-4 text-sm text-fg-muted">
            Cohorts for organizing people. Membership in the organization does not change.
          </p>
          <form
            className="grid gap-3 md:grid-cols-[1fr_2fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              run(() => createGroup({ name, description }), "Group created");
            }}
          >
            <div>
              <Label htmlFor="group-name">Name</Label>
              <Input
                id="group-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="YGP 2026"
              />
            </div>
            <div>
              <Label htmlFor="group-description">Description</Label>
              <Input
                id="group-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional"
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

      {groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create a cohort to organize staff or students. People stay in the organization either way."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              New group
            </Button>
          }
        />
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-fg-muted">
                <th className="px-4 py-3 font-medium">Group</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3">
                    {editingId === group.id ? (
                      <form
                        className="grid max-w-xl gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          run(
                            () =>
                              updateGroup(group.id, {
                                name: editName,
                                description: editDescription,
                              }),
                            "Group updated",
                          );
                        }}
                      >
                        <Input
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          aria-label="Group name"
                          required
                        />
                        <Textarea
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.target.value)}
                          aria-label="Group description"
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" loading={pending}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="font-medium">{group.name}</p>
                        <p className="mt-0.5 text-xs text-fg-muted">
                          {group.description || "No description"}
                        </p>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 min-w-[14rem]">
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
                        <p className="px-2 py-1.5 text-sm text-fg-muted">
                          No members to assign yet.
                        </p>
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
                              run(
                                () => setGroupMembers(group.id, next),
                                "Group members updated",
                              );
                            }}
                          >
                            {member.name}
                            <span className="ml-2 text-xs text-fg-muted">
                              {member.email}
                            </span>
                          </DropdownCheckboxItem>
                        ))
                      )}
                    </Dropdown>
                    {group.memberIds.length > 0 ? (
                      <p className="mt-1.5 text-xs text-fg-muted">
                        {group.memberIds
                          .slice(0, 4)
                          .map((id) => memberNameById.get(id) ?? "Member")
                          .join(", ")}
                        {group.memberIds.length > 4
                          ? ` +${group.memberIds.length - 4}`
                          : ""}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={group.isArchived ? "neutral" : "success"}>
                      {group.isArchived ? "Archived" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleting(group)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

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
