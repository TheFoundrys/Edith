import { PageHeader, Panel } from "@/components/ui/page";
import {
  ROLE_LABELS,
  capabilitiesFor,
  type AppRole,
  type Capability,
} from "@/lib/auth/roles";
import { requireStaff } from "@/lib/auth/session";

const CAPABILITY_LABELS: Record<Capability, string> = {
  managePricing: "Pricing & fees",
  managePrograms: "Programs catalog",
  manageContent: "Syllabus, assignments, quizzes",
  manageApplications: "Applications & counselling",
  manageForms: "Application forms",
  manageAiPlugins: "AI plugins",
  manageMembers: "Members & access",
  learnAsStudent: "Student learning",
};

const MATRIX_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMISSIONS_MANAGER",
  "COUNSELOR",
  "CONTENT_UPLOADER",
  "STUDENT",
];

const MATRIX_CAPS: Capability[] = [
  "managePricing",
  "managePrograms",
  "manageContent",
  "manageApplications",
  "manageForms",
  "manageAiPlugins",
  "manageMembers",
  "learnAsStudent",
];

export default async function AdminRolesPage() {
  const session = await requireStaff();
  const mine = capabilitiesFor(session.user.role);

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Who can change pricing, content, and applications. Pricing stays with admins — content uploaders cannot edit fees."
      />

      <Panel className="mb-6 p-5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-fg-muted">
          Your role
        </p>
        <p className="mt-1 font-display text-2xl text-fg">
          {ROLE_LABELS[session.user.role] ?? session.user.role}
        </p>
        <ul className="mt-3 text-sm text-fg-muted space-y-1">
          {mine.length === 0 ? (
            <li>No staff capabilities.</li>
          ) : (
            mine.map((c) => <li key={c}>· {CAPABILITY_LABELS[c]}</li>)
          )}
        </ul>
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-fg-muted">Capability</th>
              {MATRIX_ROLES.map((role) => (
                <th key={role} className="px-3 py-3 font-medium text-fg-muted">
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_CAPS.map((cap) => (
              <tr key={cap} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-fg">{CAPABILITY_LABELS[cap]}</td>
                {MATRIX_ROLES.map((role) => {
                  const allowed = capabilitiesFor(role).includes(cap);
                  return (
                    <td key={role} className="px-3 py-3 text-center">
                      {allowed ? (
                        <span className="font-medium text-fg">Yes</span>
                      ) : (
                        <span className="text-fg-muted">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <p className="mt-4 text-xs text-fg-muted max-w-2xl leading-relaxed">
        Demo logins (password <code className="font-mono">password123</code>):
        admin@thefoundrys.com · admissions@thefoundrys.com ·
        counsellor@thefoundrys.com · content@thefoundrys.com ·
        student@example.com
      </p>
    </div>
  );
}
