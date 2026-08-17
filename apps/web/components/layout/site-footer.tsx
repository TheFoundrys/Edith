import Link from "next/link";
import { APP_NAME, APP_PARENT } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-fg-muted">
        <p>
          © {new Date().getFullYear()} {APP_NAME} by {APP_PARENT}
        </p>
        <nav className="flex flex-wrap gap-4" aria-label="Legal">
          <Link
            href="/legal/privacy"
            className="hover:text-fg underline-offset-2 hover:underline"
          >
            Privacy
          </Link>
          <Link
            href="/legal/terms"
            className="hover:text-fg underline-offset-2 hover:underline"
          >
            Terms
          </Link>
          <a
            href="mailto:info@thefoundrys.com"
            className="hover:text-fg underline-offset-2 hover:underline"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
