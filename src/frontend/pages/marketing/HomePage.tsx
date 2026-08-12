import { Link } from "react-router-dom";
import { APP_LOCKUP, APP_NAME, APP_TAGLINE } from "@shared/constants/brand";

export function HomePage() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(1200px 600px at 20% 0%, color-mix(in srgb, var(--brand) 18%, transparent), transparent), linear-gradient(180deg, #f7f7fb, #fafafa)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <p className="font-display text-5xl sm:text-7xl text-brand tracking-tight">{APP_NAME}</p>
        <h1 className="mt-4 text-2xl sm:text-3xl text-fg max-w-xl font-medium">{APP_TAGLINE}</h1>
        <p className="mt-4 text-fg-muted max-w-lg text-sm leading-relaxed">
          Discover programmes, enroll, and learn on {APP_LOCKUP}
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/courses"
            className="inline-flex h-10 items-center px-4 text-sm bg-accent text-accent-fg rounded-[var(--radius-sm)]"
          >
            Browse courses
          </Link>
          <Link
            to="/register"
            className="inline-flex h-10 items-center px-4 text-sm border border-brand text-brand rounded-[var(--radius-sm)]"
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
}
