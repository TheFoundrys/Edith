import { MarketingShell } from "@/components/layout/marketing-shell";
import { APP_NAME } from "@/lib/brand";

export default function PrivacyPage() {
  return (
    <MarketingShell maxWidth="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-fg-muted">Last updated: August 2026</p>
      <div className="mt-8 space-y-4 text-sm text-fg leading-relaxed">
        <p>
          {APP_NAME} collects account and application information you provide when you
          register, apply to programs, or upload documents. This data is used to operate
          admissions workflows, communicate about your application, and fulfill institutional
          and legal obligations.
        </p>
        <p>
          Application documents are stored securely and accessible only to you and authorized
          admissions staff for your institution. We do not sell personal data.
        </p>
        <p>
          Contact{" "}
          <a href="mailto:info@thefoundrys.com" className="underline underline-offset-2">
            info@thefoundrys.com
          </a>{" "}
          for privacy requests or questions.
        </p>
      </div>
    </MarketingShell>
  );
}
