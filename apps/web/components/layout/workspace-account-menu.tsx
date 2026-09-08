"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { Dropdown, DropdownSeparator } from "@/components/ui/dropdown";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function WorkspaceAccountMenu({
  profileHref,
  roleLabel,
  onSignOut,
  signingOut,
}: {
  profileHref?: string;
  roleLabel: string;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Account";
  const image =
    session?.user && "image" in session.user
      ? (session.user as { image?: string | null }).image
      : null;

  return (
    <Dropdown
      align="end"
      ariaLabel="Account menu"
      className="workspace-account"
      panelClassName="workspace-account-panel min-w-52"
      showCaret={false}
      triggerClassName="workspace-account-button"
      label={
        <span className="workspace-account-trigger">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="lms-user-avatar lms-user-avatar-photo" />
          ) : (
            <span className="lms-user-avatar" aria-hidden>
              {initials(name)}
            </span>
          )}
          <span className="lms-user-copy workspace-account-copy">
            <span className="lms-user-name">{name}</span>
            <span className="lms-user-role">{roleLabel}</span>
          </span>
        </span>
      }
    >
      {(close) => (
        <>
          {profileHref ? (
            <Link
              href={profileHref}
              className="workspace-account-item"
              onClick={close}
            >
              <UserRound className="size-4" strokeWidth={1.75} aria-hidden />
              Profile
            </Link>
          ) : null}
          {profileHref ? <DropdownSeparator /> : null}
          <button
            type="button"
            className="workspace-account-item"
            disabled={signingOut}
            onClick={() => {
              close();
              onSignOut();
            }}
          >
            <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </>
      )}
    </Dropdown>
  );
}
