"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createIntake,
  setProgramStatus,
  toggleIntake,
  updateProgram,
} from "@/lib/actions/programs";
import { updateProgramCompassFields } from "@/lib/actions/compass-modules";
import { PROGRAM_CATEGORIES } from "@/lib/programs/categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";
import type { DegreeLevel, ProgramCategory, ProgramStatus } from "@prisma/client";

type ProgramDetail = {
  id: string;
  title: string;
  slug: string;
  category: ProgramCategory;
  degreeLevel: DegreeLevel;
  description: string | null;
  eligibilitySummary: string | null;
  imageUrl: string | null;
  price: number | null;
  tuitionCurrency: string;
  capacity: number | null;
  applicationFee: number | null;
  requiredDocs: string;
  crmCatalogId: string | null;
  requiresCrmCallback: boolean;
  status: ProgramStatus;
  campusId: string | null;
  departmentId: string | null;
  formDefinitionId: string | null;
  sku: string | null;
  duration: string | null;
  weeks: number | null;
  originalPrice: number | null;
  learningOutcomes: string[];
  tags: string[];
  specialization: string | null;
  location: string | null;
  brochureUrl: string | null;
  requiresEntranceExam: boolean;
  isHybridOnly: boolean;
  isInventoryOnly: boolean;
  domainSlug: string | null;
  batchId: string | null;
  intakes: {
    id: string;
    name: string;
    isActive: boolean;
    capacity: number | null;
    applicationClose: Date | null;
  }[];
};

export function ProgramDetailClient({
  program,
  campuses,
  departments,
  forms,
  canManagePricing = true,
}: {
  program: ProgramDetail;
  campuses: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  forms: { id: string; name: string }[];
  canManagePricing?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const docs = (() => {
    try {
      return (JSON.parse(program.requiredDocs) as string[]).join(", ");
    } catch {
      return "";
    }
  })();

  function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProgram(program.id, fd);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function onIntake(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIntakeError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await createIntake(program.id, fd);
      if (result.error) setIntakeError(result.error);
      else {
        form.reset();
        router.refresh();
      }
    });
  }

  function changeStatus(status: ProgramStatus) {
    startTransition(async () => {
      setError(null);
      const result = await setProgramStatus(program.id, status);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="peak-rise">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        <Link href="/admin/programs" className="hover:text-fg">
          Programs
        </Link>
        <span className="mx-1.5 text-border-strong">/</span>
        Edit
      </p>

      <PageHeader
        title={program.title}
        description={`Slug /${program.slug} · keep pricing and syllabus ready before you publish.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/syllabus/${program.id}`}>
              <Button variant="secondary">Syllabus</Button>
            </Link>
            {program.status === "PUBLISHED" ? (
              <Link href={`/courses/${program.slug}`} target="_blank">
                <Button variant="secondary">View live</Button>
              </Link>
            ) : null}
            {program.status === "ARCHIVED" ? (
              <Button onClick={() => changeStatus("PUBLISHED")} loading={pending}>
                Restore & publish
              </Button>
            ) : program.status !== "PUBLISHED" ? (
              <Button onClick={() => changeStatus("PUBLISHED")} loading={pending}>
                Publish
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => changeStatus("DRAFT")}
                loading={pending}
              >
                Unpublish
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-[var(--grid-pad)] flex flex-wrap items-center gap-3">
        <Badge
          tone={
            program.status === "PUBLISHED"
              ? "success"
              : program.status === "ARCHIVED"
                ? "neutral"
                : "warning"
          }
        >
          {program.status}
        </Badge>
        <p className="text-sm text-fg-muted">
          {program.status === "PUBLISHED"
            ? "Live in the catalog — save edits anytime."
            : program.status === "ARCHIVED"
              ? "Archived — publish again to restore."
              : "Draft — finish details, pricing, syllabus, then publish."}
        </p>
      </div>
      <FieldError>{error}</FieldError>

      <div className="cm-grid-2 items-start">
        <Panel className="p-[var(--grid-pad)]">
          <h2 className="font-display text-xl text-fg mb-[var(--grid-pad)]">
            Details
          </h2>
          <form onSubmit={onSave} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={program.title} required />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                name="category"
                defaultValue={program.category}
                required
              >
                {PROGRAM_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="degreeLevel">Degree level</Label>
                <Select
                  id="degreeLevel"
                  name="degreeLevel"
                  defaultValue={program.degreeLevel}
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
                <Label htmlFor="formDefinitionId">Application form</Label>
                <Select
                  id="formDefinitionId"
                  name="formDefinitionId"
                  defaultValue={program.formDefinitionId ?? ""}
                >
                  <option value="">None</option>
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campusId">Campus</Label>
                <Select
                  id="campusId"
                  name="campusId"
                  defaultValue={program.campusId ?? ""}
                >
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
                <Select
                  id="departmentId"
                  name="departmentId"
                  defaultValue={program.departmentId ?? ""}
                >
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="border border-border p-[var(--grid-gap)] space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                  Pricing
                </p>
                {!canManagePricing ? (
                  <p className="text-xs text-fg-muted">
                    Only admins can change tuition and fees.
                  </p>
                ) : null}
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Tuition</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={program.price ?? ""}
                    disabled={!canManagePricing}
                    readOnly={!canManagePricing}
                  />
                </div>
                <div>
                  <Label htmlFor="tuitionCurrency">Currency</Label>
                  <Input
                    id="tuitionCurrency"
                    name="tuitionCurrency"
                    defaultValue={program.tuitionCurrency}
                    disabled={!canManagePricing}
                    readOnly={!canManagePricing}
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    defaultValue={program.capacity ?? ""}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="applicationFee">Application fee</Label>
                <Input
                  id="applicationFee"
                  name="applicationFee"
                  type="number"
                  step="0.01"
                  defaultValue={program.applicationFee ?? ""}
                  disabled={!canManagePricing}
                  readOnly={!canManagePricing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                name="summary"
                defaultValue={program.description ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="eligibilitySummary">Eligibility</Label>
              <Textarea
                id="eligibilitySummary"
                name="eligibilitySummary"
                defaultValue={program.eligibilitySummary ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="requiredDocs">Required docs</Label>
              <Input id="requiredDocs" name="requiredDocs" defaultValue={docs} />
            </div>
            <div>
              <Label htmlFor="crmCatalogId">CRM catalog ID</Label>
              <Input
                id="crmCatalogId"
                name="crmCatalogId"
                defaultValue={program.crmCatalogId ?? ""}
                placeholder="Optional"
              />
            </div>
            <label className="flex items-start gap-2 text-sm text-fg">
              <input
                type="checkbox"
                name="requiresCrmCallback"
                defaultChecked={program.requiresCrmCallback}
                className="mt-1"
              />
              <span>
                Require CRM callback on enroll
                <span className="block text-xs text-fg-muted mt-0.5">
                  Enrollment stays pending until CentraCRM posts to
                  /api/crm/enrollment-callback.
                </span>
              </span>
            </label>
            <div id="compass-extras" className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-medium text-fg">Catalogue extras</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" name="sku" defaultValue={program.sku ?? ""} />
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" name="duration" defaultValue={program.duration ?? ""} />
                </div>
                <div>
                  <Label htmlFor="weeks">Weeks</Label>
                  <Input id="weeks" name="weeks" type="number" defaultValue={program.weeks ?? ""} />
                </div>
                <div>
                  <Label htmlFor="originalPrice">Original price</Label>
                  <Input id="originalPrice" name="originalPrice" type="number" step="0.01" defaultValue={program.originalPrice ?? ""} />
                </div>
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input id="specialization" name="specialization" defaultValue={program.specialization ?? ""} />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" defaultValue={program.location ?? ""} />
                </div>
              </div>
              <div>
                <Label htmlFor="learningOutcomes">Learning outcomes (comma-separated)</Label>
                <Input id="learningOutcomes" name="learningOutcomes" defaultValue={program.learningOutcomes?.join(", ") ?? ""} />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" defaultValue={program.tags?.join(", ") ?? ""} />
              </div>
              <div>
                <Label htmlFor="brochureUrl">Brochure URL</Label>
                <Input id="brochureUrl" name="brochureUrl" defaultValue={program.brochureUrl ?? ""} />
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="requiresEntranceExam" defaultChecked={program.requiresEntranceExam} />
                  Entrance exam
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="isHybridOnly" defaultChecked={program.isHybridOnly} />
                  Hybrid only
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="isInventoryOnly" defaultChecked={program.isInventoryOnly} />
                  Inventory only
                </label>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={pending}
                onClick={() => {
                  setError(null);
                  const root = document.getElementById("compass-extras");
                  if (!root) return;
                  const fd = new FormData();
                  root.querySelectorAll<HTMLInputElement>("input").forEach((el) => {
                    if (!el.name) return;
                    if (el.type === "checkbox") {
                      if (el.checked) fd.set(el.name, "on");
                    } else {
                      fd.set(el.name, el.value);
                    }
                  });
                  startTransition(async () => {
                    const result = await updateProgramCompassFields(program.id, fd);
                    if (result.error) setError(result.error);
                    else router.refresh();
                  });
                }}
              >
                Save catalogue extras
              </Button>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div>
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
              </div>
              {(imagePreview || program.imageUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview ?? program.imageUrl!}
                  alt=""
                  className="h-36 w-full object-cover border border-border grayscale"
                />
              )}
            </div>
            <Button type="submit" loading={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Panel>

        <div className="cm-stack">
          <Panel className="p-[var(--grid-pad)]">
            <h2 className="font-display text-xl text-fg mb-[var(--grid-pad)]">
              Next steps
            </h2>
            <ol className="space-y-3 text-sm text-fg-muted">
              <li>1. Save details and pricing.</li>
              <li>
                2.{" "}
                <Link
                  href={`/admin/syllabus/${program.id}`}
                  className="text-fg underline underline-offset-2"
                >
                  Build the syllabus
                </Link>
                .
              </li>
              <li>3. Add at least one intake.</li>
              <li>4. Publish to the student catalog.</li>
            </ol>
            {program.status !== "ARCHIVED" ? (
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => changeStatus("ARCHIVED")}
                loading={pending}
              >
                Archive program
              </Button>
            ) : null}
          </Panel>

          <Panel className="p-[var(--grid-pad)]">
            <h2 className="font-display text-xl text-fg mb-[var(--grid-pad)]">
              Intakes
            </h2>
            <ul className="space-y-3 mb-6">
              {program.intakes.length === 0 ? (
                <li className="text-sm text-fg-muted">No intakes yet.</li>
              ) : (
                program.intakes.map((intake) => (
                  <li
                    key={intake.id}
                    className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{intake.name}</p>
                      <p className="text-xs text-fg-muted">
                        {intake.isActive ? "Active" : "Inactive"}
                        {intake.capacity != null ? ` · cap ${intake.capacity}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await toggleIntake(intake.id, !intake.isActive);
                          router.refresh();
                        })
                      }
                    >
                      {intake.isActive ? "Disable" : "Enable"}
                    </Button>
                  </li>
                ))
              )}
            </ul>

            <form
              onSubmit={onIntake}
              className="space-y-3 border-t border-border pt-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                Add intake
              </p>
              <div>
                <Label htmlFor="intake-name">Name</Label>
                <Input
                  id="intake-name"
                  name="name"
                  required
                  placeholder="Fall 2027"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" name="startDate" type="date" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="applicationOpen">Open</Label>
                  <Input id="applicationOpen" name="applicationOpen" type="date" />
                </div>
                <div>
                  <Label htmlFor="applicationClose">Close</Label>
                  <Input
                    id="applicationClose"
                    name="applicationClose"
                    type="date"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="intake-capacity">Capacity</Label>
                <Input id="intake-capacity" name="capacity" type="number" />
              </div>
              <FieldError>{intakeError}</FieldError>
              <Button type="submit" variant="secondary" size="sm" loading={pending}>
                {pending ? "Adding…" : "Add intake"}
              </Button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
