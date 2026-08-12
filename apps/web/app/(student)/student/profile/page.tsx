import { ProfileForm } from "@/components/student/profile-form";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function StudentProfilePage() {
  const session = await requireStudent();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Your account details used across the learning platform."
      />
      <Panel className="p-5">
        <ProfileForm
          initialName={user?.name ?? session.user.name}
          email={session.user.email}
          phoneNumber={user?.phoneNumber}
          username={user?.username}
          headline={user?.headline}
          bio={user?.bio}
          theme={user?.theme}
          careerPath={user?.careerPath}
        />
      </Panel>
    </div>
  );
}
