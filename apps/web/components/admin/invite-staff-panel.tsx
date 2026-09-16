"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FieldHelp, Input, Label, Select } from "@/components/ui/input";
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
  const [copied, setCopied] = useState(false);

  const roles = canInviteAdmins
    ? STAFF_ROLES
    : STAFF_ROLES.filter((item) => item !== "SUPER_ADMIN");

  return (
    <Panel className="mb-[var(--grid-pad)] p-[var(--grid-pad)]">
      <h2 className="font-display text-lg text-fg">Invite staff</h2>
      <p className="mt-1 mb-4 text-sm text-fg-muted">
        Staff join by invitation only. Students register themselves. Links expire in 7 days.
      </p>
      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_14rem_auto]"
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
            setCopied(false);
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
            placeholder="name@campus.edu"
            autoComplete="off"
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
          <Label htmlFor="invite-role">Access</Label>
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
          <Button type="submit" loading={pending}>
            {pending ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </form>
      {inviteUrl ? (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-border bg-bg p-3">
          <p className="text-xs font-medium text-fg">Invite link</p>
          <FieldHelp>
            Copy this if email is not configured. Share it only with the invitee.
          </FieldHelp>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 break-all font-mono text-xs text-fg">
              {inviteUrl}
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteUrl);
                  setCopied(true);
                } catch {
                  toast({
                    title: "Copy the link manually",
                    description: inviteUrl,
                    tone: "danger",
                  });
                }
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
