"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { createProgram } from "@/lib/actions/programs";
import { PROGRAM_CATEGORIES } from "@/lib/programs/categories";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await createProgram(new FormData(e.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/admin/programs/${result.id}`);
  }

  return (
    <div className="peak-rise max-w-2xl">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        <Link href="/admin/programs" className="hover:text-fg">
          Programs
        </Link>
        <span className="mx-1.5 text-border-strong">/</span>
        New
      </p>

      <PageHeader
        title="New program"
        description="Start with the essentials. You can add syllabus and publish from the program page next."
      />

      <Panel className="p-[var(--grid-pad)]">
        <form onSubmit={onSubmit} className="space-y-4">
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
              defaultValue="YOUNG_POST_GRADUATE"
              required
            >
              {PROGRAM_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="degreeLevel">Degree level</Label>
            <Select id="degreeLevel" name="degreeLevel" defaultValue="BACHELORS">
              <option value="CERTIFICATE">Certificate</option>
              <option value="DIPLOMA">Diploma</option>
              <option value="BACHELORS">Bachelor&apos;s</option>
              <option value="MASTERS">Master&apos;s</option>
              <option value="DOCTORATE">Doctorate</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          <div className="border border-border p-[var(--grid-gap)] space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
              Pricing
            </p>
            {!canManagePricing ? (
              <p className="text-xs text-fg-muted">
                Pricing is managed by admins.
              </p>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tuitionAmount">Tuition</Label>
                <Input
                  id="tuitionAmount"
                  name="tuitionAmount"
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
                  defaultValue="USD"
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
            <Select id="formDefinitionId" name="formDefinitionId" defaultValue="">
              <option value="">Attach later</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" name="summary" />
          </div>
          <div>
            <Label htmlFor="eligibilitySummary">Eligibility</Label>
            <Textarea id="eligibilitySummary" name="eligibilitySummary" />
          </div>
          <div>
            <Label htmlFor="requiredDocs">Required docs (comma-separated)</Label>
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
              placeholder="Optional CentraCRM program id"
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
                Enrollment stays pending until CentraCRM confirms via webhook.
              </span>
            </span>
          </label>
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
              {pending ? "Creating…" : "Create program"}
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
