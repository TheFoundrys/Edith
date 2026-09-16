"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { revokeStaffInvite } from "@/lib/actions/invites";

export type InviteRow = {
  id: string;
  email: string;
  name: string | null;
  roleLabel: string;
  status: string;
  expiresAt: string;
  invitedBy: string;
};

function inviteTone(status: string) {
  if (status === "PENDING") return "warning" as const;
  if (status === "ACCEPTED") return "success" as const;
  return "neutral" as const;
}

function inviteLabel(status: string) {
  if (status === "PENDING") return "Pending";
  if (status === "ACCEPTED") return "Accepted";
  if (status === "REVOKED") return "Revoked";
  if (status === "EXPIRED") return "Expired";
  return status;
}

export function InvitesTable({ rows }: { rows: InviteRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <Panel className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-fg-muted">
            <th className="px-4 py-3 font-medium">Invitee</th>
            <th className="px-4 py-3 font-medium">Access</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Expires</th>
            <th className="px-4 py-3 font-medium">Invited by</th>
            <th className="px-4 py-3 font-medium text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <p className="font-medium">{row.name || row.email}</p>
                {row.name ? (
                  <p className="text-xs text-fg-muted">{row.email}</p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-fg-muted">{row.roleLabel}</td>
              <td className="px-4 py-3">
                <Badge tone={inviteTone(row.status)}>
                  {inviteLabel(row.status)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                {new Date(row.expiresAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3 text-fg-muted">{row.invitedBy}</td>
              <td className="px-4 py-3 text-right">
                {row.status === "PENDING" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await revokeStaffInvite(row.id);
                        if (result.error) {
                          toast({
                            title: "Could not revoke",
                            description: result.error,
                            tone: "danger",
                          });
                          return;
                        }
                        toast({ title: "Invitation revoked", tone: "success" });
                        router.refresh();
                      })
                    }
                  >
                    Revoke
                  </Button>
                ) : (
                  <span className="text-fg-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
