import { revalidatePath } from "next/cache";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";
import { EmailCategory } from "@prisma/client";

async function createEmailTemplate(formData: FormData) {
  "use server";
  const session = await requireCapability("manageContent");
  const name = String(formData.get("name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  if (!name || !subject) return;
  const bodyHtml = String(formData.get("bodyHtml") || "");
  const bodyText = String(formData.get("bodyText") || "").trim() || null;
  await prisma.emailTemplate.create({
    data: {
      organizationId: session.user.organizationId,
      name,
      key: name.toLowerCase().replace(/\s+/g, "-"),
      subject,
      bodyHtml,
      bodyText,
      htmlContent: bodyHtml,
      textContent: bodyText ?? "",
      category: EmailCategory.TRANSACTIONAL,
    },
  });
  revalidatePath("/admin/email-templates");
}

export default async function AdminEmailTemplatesPage() {
  const session = await requireCapability("manageContent");
  const templates = await prisma.emailTemplate.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Email templates" description="Reusable message templates." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel className="p-5">
          <form action={createEmailTemplate} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required />
            </div>
            <div>
              <Label htmlFor="bodyHtml">HTML body</Label>
              <Textarea id="bodyHtml" name="bodyHtml" rows={5} />
            </div>
            <Button type="submit">Create template</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <ul className="space-y-2">
            {templates.map((t) => (
              <li key={t.id} className="text-sm border-b border-border py-2">
                <span className="font-medium">{t.name}</span>
                <span className="block text-fg-muted">{t.subject}</span>
              </li>
            ))}
            {templates.length === 0 ? <p className="text-sm text-fg-muted">No templates.</p> : null}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
