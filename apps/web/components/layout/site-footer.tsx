import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { HomeNewsletterSignup } from "@/components/marketing/home-newsletter-signup";
import { APP_NAME, APP_PARENT } from "@/lib/brand";

const PLATFORM_LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/register", label: "Register" },
  { href: "/login", label: "Sign in" },
  { href: "/student/dashboard", label: "Student dashboard" },
];

const RESOURCE_LINKS = [
  { href: "/courses", label: "Catalogue" },
  { href: "/student/enroll", label: "Enrol" },
  { href: "/student/applications", label: "Applications" },
  { href: "/student/certificates", label: "Certificates" },
];

const COMPANY_LINKS = [
  { href: "mailto:info@thefoundrys.com", label: "Contact" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
];

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="home-footer-group-title">{title}</p>
      <ul className="home-footer-links">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="home-footer-link">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({ variant = "marketing" }: { variant?: "minimal" | "marketing" }) {
  if (variant === "minimal") {
    return (
      <footer className="home-footer-minimal border-t border-border mt-auto">
        <div className="home-container py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-fg-muted">
          <p>
            © {new Date().getFullYear()} {APP_NAME}
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

  return (
    <footer className="home-footer" id="contact">
      <div className="home-container home-footer-inner">
        <div className="home-footer-brand">
          <BrandMark />
          <p className="home-footer-tagline">
            {APP_NAME} — deep-tech learning from {APP_PARENT}. AI, cybersecurity,
            data, blockchain, and quantum programmes.
          </p>
          <p className="home-footer-copy">
            © {new Date().getFullYear()} {APP_NAME}
          </p>
        </div>
        <div className="home-footer-nav">
          <FooterLinkGroup title="Platform" links={PLATFORM_LINKS} />
          <FooterLinkGroup title="Resources" links={RESOURCE_LINKS} />
          <FooterLinkGroup title="Company" links={COMPANY_LINKS} />
        </div>
        <HomeNewsletterSignup />
      </div>
    </footer>
  );
}
