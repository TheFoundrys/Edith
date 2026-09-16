"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createProgram } from "@/lib/actions/programs";
import {
  isContentProgram,
  PROGRAM_CATEGORIES,
} from "@/lib/programs/categories";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

type CatalogFlow = "content" | "degree";

export function NewProgramForm({
  campuses,
  departments,
  forms,
  canManagePricing = true,
}: {
  campuses: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  forms: { id: string; name: string }[];
  canManagePricing?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [flow, setFlow] = useState<CatalogFlow>("content");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const category = String(fd.get("category") || "");
    const result = await createProgram(fd);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (isContentProgram(category)) {
      router.push(`/admin/syllabus/${result.id}`);
      return;
    }
    router.push(`/admin/programs/${result.id}`);
  }

  return (
    <div className="max-w-2xl">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        <Link href="/admin/programs" className="hover:text-fg">
          Programs
        </Link>
        <span className="mx-1.5 text-border-strong">/</span>
        New
      </p>

      <PageHeader
        title="New program"
        description="YGP and PGP are content courses. Degrees use admissions, CRM, enrollments, and online or offline payment."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setFlow("content")}
          className={`border p-4 text-left ${
            flow === "content"
              ? "border-fg bg-bg-muted"
              : "border-border hover:border-border-strong"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
            YGP / PGP
          </p>
          <p className="mt-1 font-medium text-fg">Content course</p>
          <p className="mt-1 text-xs text-fg-muted">
            Section name, title, and content. No CRM or application form.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setFlow("degree")}
          className={`border p-4 text-left ${
            flow === "degree"
              ? "border-fg bg-bg-muted"
              : "border-border hover:border-border-strong"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Degree
          </p>
          <p className="mt-1 font-medium text-fg">Admissions course</p>
          <p className="mt-1 text-xs text-fg-muted">
            CRM, enrollments, and online or offline payments.
          </p>
        </button>
      </div>

      <Panel className="p-[var(--grid-pad)]">
        <form onSubmit={onSubmit} className="space-y-4">
          {flow === "content" ? (
            <>
              <div>
                <Label htmlFor="name">Course title</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="AI Fluency"
                />
              </div>
              <div>
                <Label htmlFor="category">Track</Label>
                <Select
                  id="category"
                  name="category"
                  defaultValue="YOUNG_POST_GRADUATE"
                  required
                >
                  <option value="YOUNG_POST_GRADUATE">
                    YGP (Young Graduate Program)
                  </option>
                  <option value="POST_GRADUATE">
                    PGP (Post Graduate Program)
                  </option>
                </Select>
              </div>
              <input type="hidden" name="degreeLevel" value="CERTIFICATE" />
              <input type="hidden" name="tuitionCurrency" value="INR" />
              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  rows={3}
                  placeholder="Optional — shown on the public course page"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="B.Sc. Computer Science"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  id="category"
                  name="category"
                  defaultValue="UNDERGRADUATE_DEGREE"
                  required
                >
                  {PROGRAM_CATEGORIES.filter(
                    (c) =>
                      c.value !== "YOUNG_POST_GRADUATE" &&
                      c.value !== "POST_GRADUATE",
                  ).map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="degreeLevel">Degree level</Label>
                  <Select
                    id="degreeLevel"
                    name="degreeLevel"
                    defaultValue="BACHELORS"
                  >
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="DIPLOMA">Diploma</option>
                    <option value="BACHELORS">Bachelor&apos;s</option>
                    <option value="MASTERS">Master&apos;s</option>
                    <option value="DOCTORATE">Doctorate</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deliveryMode">Delivery</Label>
                  <Select
                    id="deliveryMode"
                    name="deliveryMode"
                    defaultValue="HYBRID"
                  >
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline (on campus)</option>
                    <option value="HYBRID">Hybrid (online + campus)</option>
                  </Select>
                </div>
              </div>

              <div className="border border-border p-[var(--grid-gap)] space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                  Pricing · online and offline
                </p>
                {!canManagePricing ? (
                  <p className="text-xs text-fg-muted">
                    Pricing is managed by admins.
                  </p>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Tuition</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      disabled={!canManagePricing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tuitionCurrency">Currency</Label>
                    <Input
                      id="tuitionCurrency"
                      name="tuitionCurrency"
                      defaultValue="INR"
                      disabled={!canManagePricing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="applicationFee">Application fee</Label>
                    <Input
                      id="applicationFee"
                      name="applicationFee"
                      type="number"
                      step="0.01"
                      disabled={!canManagePricing}
                    />
                  </div>
                </div>
                <p className="text-xs text-fg-muted">
                  Students can pay online (Razorpay) or staff can record an
                  offline payment on the application.
                </p>
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" name="capacity" type="number" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campusId">Campus</Label>
                  <Select id="campusId" name="campusId" defaultValue="">
                    <option value="">—</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="departmentId">Department</Label>
                  <Select id="departmentId" name="departmentId" defaultValue="">
                    <option value="">—</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="formDefinitionId">Application form</Label>
                <Select
                  id="formDefinitionId"
                  name="formDefinitionId"
                  defaultValue=""
                >
                  <option value="">Attach later</option>
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-xs text-fg-muted">
                  Required before publishing a degree. Opens CRM enrollments
                  after the student applies.
                </p>
              </div>
              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea id="summary" name="summary" />
              </div>
              <div>
                <Label htmlFor="eligibilitySummary">Eligibility</Label>
                <Textarea
                  id="eligibilitySummary"
                  name="eligibilitySummary"
                />
              </div>
              <div>
                <Label htmlFor="requiredDocs">
                  Required docs (comma-separated)
                </Label>
                <Input
                  id="requiredDocs"
                  name="requiredDocs"
                  placeholder="transcript, id_proof"
                />
              </div>
              <div>
                <Label htmlFor="crmCatalogId">CRM catalog ID</Label>
                <Input
                  id="crmCatalogId"
                  name="crmCatalogId"
                  placeholder="CentraCRM program id"
                />
              </div>
              <label className="flex items-start gap-2 text-sm text-fg">
                <input
                  type="checkbox"
                  name="requiresCrmCallback"
                  className="mt-1"
                />
                <span>
                  Require CRM callback on enroll
                  <span className="block text-xs text-fg-muted mt-0.5">
                    Enrollment stays pending until CentraCRM confirms via
                    webhook.
                  </span>
                </span>
              </label>
            </>
          )}

          <div className="border-t border-border pt-4 space-y-3">
            <Label htmlFor="image">Cover image</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="py-1.5 file:mr-3 file:border-0 file:bg-bg file:px-2 file:py-1 file:text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setImagePreview(null);
                  return;
                }
                setImagePreview(URL.createObjectURL(file));
              }}
            />
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt=""
                className="h-36 w-full object-cover border border-border grayscale"
              />
            ) : null}
          </div>
          <FieldError>{error}</FieldError>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" loading={pending}>
              {pending
                ? "Creating…"
                : flow === "content"
                  ? "Create and add syllabus"
                  : "Create program"}
            </Button>
            <Link href="/admin/programs">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Panel>
    </div>
  );
}
