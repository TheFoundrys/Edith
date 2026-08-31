import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { PasswordPageShell } from "@/components/layout/password-page-shell";
import { getInvitePreview } from "@/lib/actions/invites";
import Link from "next/link";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await getInvitePreview(token);

  return (
    <PasswordPageShell>
      {"error" in preview ? (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invitation unavailable</h1>
          <p className="mt-2 text-sm text-fg-muted">{preview.error}</p>
          <Link href="/login" className="mt-6 inline-block text-sm underline underline-offset-2">
            Back to sign in
          </Link>
        </div>
      ) : (
        <AcceptInviteForm
          token={token}
          email={preview.email}
          name={preview.name}
          organizationName={preview.organizationName}
          roleLabel={preview.roleLabel}
        />
      )}
    </PasswordPageShell>
  );
}
