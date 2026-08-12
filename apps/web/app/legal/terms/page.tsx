import { MarketingShell } from "@/components/layout/marketing-shell";
import { APP_NAME } from "@/lib/brand";

export default function TermsPage() {
  return (
    <MarketingShell maxWidth="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Terms of Use</h1>
      <p className="mt-2 text-sm text-fg-muted">Last updated: August 2026</p>
      <div className="mt-8 space-y-4 text-sm text-fg leading-relaxed">
        <p>
          By creating an account or submitting an application through {APP_NAME}, you agree to
          provide accurate information and to use the platform only for legitimate admissions
          purposes.
        </p>
        <p>
          Submitted applications may be reviewed by institutional staff and synced to connected
          CRM systems used by the institution. You are responsible for safeguarding your login
          credentials.
        </p>
        <p>
          Program offerings, fees, and intake dates are set by the institution and may change.
          Contact admissions for official confirmation of any offer or enrollment decision.
        </p>
      </div>
    </MarketingShell>
  );
}
