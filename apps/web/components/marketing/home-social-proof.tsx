import type { HomePageData } from "@/lib/marketing/home-data";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function HomeSocialProof({
  socialProof,
}: {
  socialProof: HomePageData["socialProof"];
}) {
  const avatars = socialProof.avatars.slice(0, 4);
  if (avatars.length === 0 && socialProof.learnerCount === 0) return null;

  return (
    <div className="home-social-proof">
      {avatars.length > 0 ? (
        <div className="home-social-avatars" aria-hidden>
          {avatars.map((avatar, index) => (
            <span
              key={`${avatar.name}-${index}`}
              className="home-social-avatar"
              style={{ zIndex: avatars.length - index }}
            >
              {avatar.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar.image} alt="" />
              ) : (
                initials(avatar.name)
              )}
            </span>
          ))}
        </div>
      ) : null}
      <p className="home-social-label">
        <strong>{socialProof.learnerLabel}</strong> learners on Edith
      </p>
    </div>
  );
}
