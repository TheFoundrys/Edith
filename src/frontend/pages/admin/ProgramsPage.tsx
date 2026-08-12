import { FormEvent, useEffect, useState } from "react";
import { createProgram, listAdminPrograms } from "@frontend/services/api/programs";
import { Button } from "@frontend/components/common/button";
import { Input, Label, Select } from "@frontend/components/forms/input";
import { PageHeader, Panel } from "@frontend/components/layout/page";
import { PROGRAM_CATEGORIES } from "@shared/constants/categories";

export function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const r = await listAdminPrograms();
    setPrograms(r.programs);
  }

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await createProgram({
      name: fd.get("name"),
      category: fd.get("category"),
      degreeLevel: fd.get("degreeLevel"),
      summary: fd.get("summary"),
      tuitionAmount: fd.get("tuitionAmount") ? Number(fd.get("tuitionAmount")) : null,
      status: "PUBLISHED",
    });
    e.currentTarget.reset();
    await refresh();
    setLoading(false);
  }

  return (
    <div>
      <PageHeader title="Programs" description="Create and manage catalogue programmes." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel className="p-5">
          <form onSubmit={onCreate} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue="YOUNG_POST_GRADUATE">
                {PROGRAM_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.shortLabel}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="degreeLevel">Degree level</Label>
              <Select id="degreeLevel" name="degreeLevel" defaultValue="CERTIFICATE">
                <option value="CERTIFICATE">Certificate</option>
                <option value="DIPLOMA">Diploma</option>
                <option value="BACHELORS">Bachelors</option>
                <option value="MASTERS">Masters</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Input id="summary" name="summary" />
            </div>
            <div>
              <Label htmlFor="tuitionAmount">Tuition</Label>
              <Input id="tuitionAmount" name="tuitionAmount" type="number" step="0.01" />
            </div>
            <Button type="submit" loading={loading}>
              Create published program
            </Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <ul className="space-y-2">
            {programs.map((p) => (
              <li key={String(p.id)} className="text-sm border-b border-border py-2">
                <span className="font-medium">{String(p.name)}</span>
                <span className="block text-fg-muted text-xs">
                  {String(p.status)} · {String(p.slug)}
                </span>
              </li>
            ))}
            {programs.length === 0 ? <p className="text-sm text-fg-muted">No programs.</p> : null}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
