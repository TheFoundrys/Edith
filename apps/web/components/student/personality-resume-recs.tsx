import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PersonalityResumeRecs({
  skills,
  recs,
}: {
  skills: string[];
  recs: { slug: string; title: string; reason: string; href: string }[];
}) {
  return (
    <div className="space-y-4">
      {skills.length ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            Skills from resume
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <li key={skill}>
                <Badge tone="neutral">{skill}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-fg-muted">
          No catalogue skill keywords matched yet. The Edith Personality Profile
          sitting is still the next step.
        </p>
      )}
      {recs.length ? (
        <ul className="space-y-4">
          {recs.map((item) => (
            <li
              key={item.slug}
              className="border-t border-border pt-4 first:border-0 first:pt-0"
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-fg-muted">{item.reason}</p>
              <Link href={item.href} className="mt-2 inline-block">
                <Button size="sm" variant="secondary">
                  View programme
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
