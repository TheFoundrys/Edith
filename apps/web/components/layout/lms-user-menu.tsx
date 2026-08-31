"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function LmsUserMenu({
  profileHref,
  roleLabel = "Learner",
}: {
  profileHref?: string;
  roleLabel?: string;
}) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Learner";
  const image =
    session?.user && "image" in session.user
      ? (session.user as { image?: string | null }).image
      : null;

  const body = (
    <>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="lms-user-avatar lms-user-avatar-photo" />
      ) : (
        <span className="lms-user-avatar" aria-hidden>
          {initials(name)}
        </span>
      )}
      <span className="lms-user-copy">
        <span className="lms-user-name">{name}</span>
        <span className="lms-user-role">{roleLabel}</span>
      </span>
      {profileHref ? (
        <ChevronDown className={cn("lms-user-chevron size-4")} strokeWidth={1.75} aria-hidden />
      ) : null}
    </>
  );

  if (!profileHref) {
    return <div className="lms-user-menu is-static">{body}</div>;
  }

  return (
    <Link href={profileHref} className="lms-user-menu">
      {body}
    </Link>
  );
}
