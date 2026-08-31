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

export function InvitesTable({ rows }: { rows: InviteRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <Panel className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-fg-muted">
            <th className="px-5 py-3 font-medium">Invitee</th>
            <th className="px-5 py-3 font-medium">Access</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Expires</th>
            <th className="px-5 py-3 font-medium">Invited by</th>
            <th className="px-5 py-3 font-medium"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="px-5 py-3">
                <p className="font-medium">{row.name || row.email}</p>
                <p className="text-xs text-fg-muted">{row.email}</p>
              </td>
              <td className="px-5 py-3">{row.roleLabel}</td>
              <td className="px-5 py-3">
                <Badge tone={row.status === "PENDING" ? "warning" : "neutral"}>
                  {row.status.toLowerCase()}
                </Badge>
              </td>
              <td className="px-5 py-3 text-fg-muted">
                {new Date(row.expiresAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3 text-fg-muted">{row.invitedBy}</td>
              <td className="px-5 py-3 text-right">
                {row.status === "PENDING" ? (
                  <Button
                    size="sm"
                    variant="ghost"
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
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
