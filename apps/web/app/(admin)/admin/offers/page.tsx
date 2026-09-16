import Link from "next/link";
import { OfferForm } from "@/components/admin/offer-form";
import { WithdrawOfferButton } from "@/components/admin/withdraw-offer-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireCapability } from "@/lib/auth/session";
import { redirectIfCompassAdminRoute } from "@/lib/compass/require-edith";
import { prisma } from "@/lib/db";
import { offerStatusLabel } from "@/lib/payments/discounts";
import { resolveCourseListPrice } from "@/lib/programs/pricing";
import { formatCurrency } from "@/lib/utils";

function statusTone(status: string) {
  if (status === "OFFERED") return "success" as const;
  if (status === "WITHDRAWN") return "neutral" as const;
  return "info" as const;
}

export default async function AdminOffersPage() {
  redirectIfCompassAdminRoute();
  const session = await requireCapability("managePricing");
  const orgId = session.user.organizationId;
  const [offers, programs, students, settings] = await Promise.all([
    prisma.programOffer.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        program: {
          select: {
            title: true,
            price: true,
            pricing: true,
            slug: true,
            sku: true,
            domainSlug: true,
            tuitionCurrency: true,
          },
        },
      },
    }),
    prisma.program.findMany({
      where: { organizationId: orgId, status: { not: "ARCHIVED" } },
      select: {
        id: true,
        title: true,
        price: true,
        pricing: true,
        slug: true,
        sku: true,
        domainSlug: true,
        tuitionCurrency: true,
      },
      orderBy: { title: "asc" },
    }),
    prisma.membership.findMany({
      where: { organizationId: orgId, role: "STUDENT" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.paymentSettings.findUnique({
      where: { organizationId: orgId },
      select: { currency: true },
    }),
  ]);

  const currency = settings?.currency || "INR";
  const live = offers.filter((offer) => offer.status === "OFFERED").length;
  const programOptions = programs.map((program) => ({
    id: program.id,
    title: program.title,
    listPrice: resolveCourseListPrice(program),
    currency: settings?.currency || program.tuitionCurrency || "INR",
  }));

  return (
    <div>
      <PageHeader
        title="Program offers"
        description="A custom tuition for one student on one program. It replaces the catalog price at checkout. Coupons still apply on top."
        actions={
          <Link href="/admin/coupons" className="text-sm text-fg-muted underline">
            Coupons
          </Link>
        }
      />

      <p className="mb-[var(--grid-pad)] text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        Student + Program → Custom price
      </p>

      <div className="peak-stats">
        <div className="peak-stat">
          <p className="peak-stat-label">Offers</p>
          <p className="peak-stat-value">{offers.length}</p>
        </div>
        <div className="peak-stat">
          <p className="peak-stat-label">Live</p>
          <p className="peak-stat-value">{live}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,24rem)_1fr]">
        <Panel className="p-[var(--grid-pad)] h-fit">
          <h2 className="font-display text-lg text-fg">New offer</h2>
          <p className="mt-1 mb-4 text-sm text-fg-muted">
            Saving again for the same student and program updates the live offer.
          </p>
          {students.length === 0 ? (
            <p className="text-sm text-fg-muted">
              Add a student membership before creating an offer.
            </p>
          ) : (
            <OfferForm
              students={students.map((row) => row.user)}
              programs={programOptions}
            />
          )}
        </Panel>

        <div>
          {offers.length === 0 ? (
            <EmptyState
              title="No offers yet"
              description="Pick a student and a program, then set the tuition they should pay before GST and coupons."
            />
          ) : (
            <div className="cm-grid">
              {offers.map((offer) => {
                const listPrice = resolveCourseListPrice(offer.program);
                const offerCurrency =
                  settings?.currency || offer.program.tuitionCurrency || currency;
                return (
                  <article key={offer.id} className="peak-card">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                        {offer.program.title}
                      </p>
                      <Badge tone={statusTone(offer.status)}>
                        {offerStatusLabel(offer.status)}
                      </Badge>
                    </div>
                    <h2 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg">
                      {offer.user.name}
                    </h2>
                    <p className="mt-1 text-sm text-fg-muted">{offer.user.email}</p>

                    <dl className="mt-[var(--grid-pad)] space-y-1.5 text-[13px] border-t border-border pt-[var(--grid-gap)]">
                      <div className="flex justify-between gap-3">
                        <dt className="text-fg-muted">Catalog</dt>
                        <dd className="tabular-nums">
                          {listPrice > 0
                            ? formatCurrency(listPrice, offerCurrency)
                            : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-fg-muted">Offered</dt>
                        <dd className="font-medium tabular-nums">
                          {formatCurrency(offer.customPrice, offerCurrency)}
                        </dd>
                      </div>
                    </dl>

                    {offer.status === "OFFERED" ? (
                      <div className="mt-auto pt-[var(--grid-pad)]">
                        <WithdrawOfferButton offerId={offer.id} />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
