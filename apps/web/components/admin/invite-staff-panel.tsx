"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { inviteStaffMember } from "@/lib/actions/invites";
import { ROLE_LABELS, STAFF_ROLES, type AppRole } from "@/lib/auth/roles";

export function InviteStaffPanel({
  canInviteAdmins,
}: {
  canInviteAdmins: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AppRole>("ADMISSIONS_MANAGER");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const roles = canInviteAdmins
    ? STAFF_ROLES
    : STAFF_ROLES.filter((item) => item !== "SUPER_ADMIN");

  return (
    <Panel className="mb-4 p-4">
      <form
        className="grid gap-3 md:grid-cols-[1fr_1fr_12rem_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await inviteStaffMember({ email, name, role });
            if (result.error) {
              toast({
                title: "Could not send invitation",
                description: result.error,
                tone: "danger",
              });
              return;
            }
            toast({ title: "Staff invitation created", tone: "success" });
            setInviteUrl(result.inviteUrl ?? null);
            setEmail("");
            setName("");
            router.refresh();
          });
        }}
      >
        <div>
          <Label htmlFor="invite-email">Work email</Label>
          <Input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="invite-name">Name</Label>
          <Input
            id="invite-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <Label htmlFor="invite-role">Staff access</Label>
          <Select
            id="invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value as AppRole)}
          >
            {roles.map((item) => (
              <option key={item} value={item}>
                {ROLE_LABELS[item]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" size="sm" loading={pending}>
            Send invite
          </Button>
        </div>
      </form>
      <p className="mt-2 text-xs text-fg-muted">
        Staff join by invitation only. Students continue to self-register. Links expire in 7 days.
      </p>
      {inviteUrl ? (
        <p className="mt-2 break-all text-xs text-fg">
          Invite link: <a href={inviteUrl} className="underline underline-offset-2">{inviteUrl}</a>
        </p>
      ) : null}
    </Panel>
  );
}
