/**
 * Development seeder. DESTRUCTIVE: main() opens by deleting every user,
 * organization, programme, application and payment. Never run against a
 * database holding real data — use prisma/publish-catalog.ts instead.
 */
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  ApplicationStatus,
  ProgramKind,
  ProgramStatus,
  Role,
  SyllabusStatus,
} from "@prisma/client";
import { FOUNDRYS_PROGRAMS } from "./catalog-data";

const prisma = new PrismaClient();


/** Inquiry form engine matching The Foundry's paper registration form */
function foundrysInquiryFormSchema() {
  return {
    sections: [
      {
        id: "personal",
        title: "01 | Personal Details",
        fields: [
          { key: "full_name", type: "text", label: "Full Name", required: true },
          { key: "email", type: "email", label: "Email", required: true },
          { key: "phone", type: "phone", label: "Phone", required: true },
          { key: "date_of_birth", type: "date", label: "Date of Birth", required: true },
          {
            key: "gender",
            type: "select",
            label: "Gender",
            required: true,
            options: [
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
              { label: "Other", value: "other" },
            ],
          },
          { key: "city", type: "text", label: "City", required: true },
          { key: "state", type: "text", label: "State", required: true },
          { key: "pincode", type: "text", label: "Pincode", required: true },
        ],
      },
      {
        id: "current_profile",
        title: "02 | Current Profile",
        fields: [
          {
            key: "highest_qualification",
            type: "text",
            label: "Highest Qualification",
            required: true,
          },
          {
            key: "stream_specialization",
            type: "text",
            label: "Stream / Specialization",
            required: true,
          },
          {
            key: "year_of_passing",
            type: "text",
            label: "Year of Passing / Pursuing",
            required: true,
          },
          {
            key: "college_org",
            type: "text",
            label: "College / University / Organization",
            required: true,
          },
          {
            key: "current_status",
            type: "select",
            label: "Current Status",
            required: true,
            options: [
              { label: "Student", value: "student" },
              { label: "Working Professional", value: "working" },
              { label: "Fresher", value: "fresher" },
              { label: "Career Break", value: "career_break" },
              { label: "Other", value: "other" },
            ],
          },
          {
            key: "work_experience",
            type: "text",
            label: "Work Experience (Years / Months)",
            required: false,
            placeholder: "e.g. 2 years 3 months",
          },
          {
            key: "current_role",
            type: "text",
            label: "Current Role / Designation",
            required: false,
          },
          {
            key: "company_name",
            type: "text",
            label: "Organization / Company Name",
            required: false,
          },
        ],
      },
      {
        id: "goals",
        title: "04 | Your Goals",
        description: "Tell us what you want to achieve",
        fields: [
          {
            key: "goal_career_start",
            type: "checkbox",
            label: "Start a career in AI / Cybersecurity",
            required: false,
          },
          {
            key: "goal_upgrade_skills",
            type: "checkbox",
            label: "Upgrade my skills for career growth",
            required: false,
          },
          {
            key: "goal_switch_tech",
            type: "checkbox",
            label: "Switch my career to Tech / DeepTech",
            required: false,
          },
          {
            key: "goal_projects",
            type: "checkbox",
            label: "Build real-world projects & portfolio",
            required: false,
          },
          {
            key: "goal_soft_skills",
            type: "checkbox",
            label: "Enhance communication & soft skills",
            required: false,
          },
          {
            key: "goal_high_paying",
            type: "checkbox",
            label: "Prepare for high-paying roles",
            required: false,
          },
          {
            key: "goal_venture",
            type: "checkbox",
            label: "Start my own venture",
            required: false,
          },
          {
            key: "goal_other",
            type: "text",
            label: "Other goal",
            required: false,
          },
        ],
      },
      {
        id: "learning_preference",
        title: "05 | Learning Preference",
        fields: [
          {
            key: "preferred_mode",
            type: "select",
            label: "Preferred Mode",
            required: true,
            options: [
              { label: "Online (Live)", value: "online_live" },
              { label: "Offline (Hyderabad)", value: "offline_hyd" },
              { label: "Offline (Warangal)", value: "offline_wgl" },
              { label: "Hybrid", value: "hybrid" },
            ],
          },
          {
            key: "preferred_batch",
            type: "select",
            label: "Preferred Batch Timing",
            required: true,
            options: [
              { label: "Weekdays", value: "weekdays" },
              { label: "Weekends", value: "weekends" },
              { label: "Flexible", value: "flexible" },
            ],
          },
          {
            key: "heard_about",
            type: "select",
            label: "How did you hear about us?",
            required: true,
            options: [
              { label: "Social Media", value: "social" },
              { label: "Friend / Referral", value: "referral" },
              { label: "Event / Seminar", value: "event" },
              { label: "Website", value: "website" },
              { label: "Other", value: "other" },
            ],
          },
        ],
      },
      {
        id: "documents",
        title: "Documents",
        fields: [
          {
            key: "id_proof",
            type: "file",
            label: "Government ID",
            required: true,
          },
          {
            key: "resume",
            type: "file",
            label: "Resume / CV",
            required: false,
          },
        ],
      },
      {
        id: "declaration",
        title: "Declaration",
        fields: [
          {
            key: "declare_true",
            type: "checkbox",
            label: "I declare that the information provided is true and complete",
            required: true,
          },
        ],
      },
    ],
  };
}

async function main() {
  await prisma.crmSyncLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.applicationEvent.deleteMany();
  await prisma.application.deleteMany();
  await prisma.formVersion.deleteMany();
  await prisma.formDefinition.deleteMany();
  await prisma.intake.deleteMany();
  await prisma.program.deleteMany();
  await prisma.department.deleteMany();
  await prisma.campus.deleteMany();
  await prisma.membershipRole.deleteMany();
  await prisma.permissionRole.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: {
      title: "The Foundry's",
      slug: "the-foundrys",
      primaryColor: "#111111",
      timezone: "Asia/Kolkata",
    },
  });

  // Assignable roles for the members console. Membership.role stays the enum the
  // session checks read; these are the extra roles an admin can grant per member.
  const defaultPermissionRoles = [
    {
      slug: "administrator",
      name: "Administrator",
      description: "Full access to every admin area.",
    },
    {
      slug: "admissions",
      name: "Admissions",
      description: "Applications, forms, offers and fees.",
    },
    {
      slug: "counsellor",
      name: "Counsellor",
      description: "Applicant counselling and follow-ups.",
    },
    {
      slug: "content-author",
      name: "Content author",
      description: "Syllabus, assignments, quizzes and announcements.",
    },
    {
      slug: "member",
      name: "Member",
      description: "Standard learner access.",
    },
  ];

  const permissionRoleIdBySlug = new Map<string, string>();
  for (const role of defaultPermissionRoles) {
    const created = await prisma.permissionRole.create({
      data: { ...role, organizationId: org.id, isSystem: true },
    });
    permissionRoleIdBySlug.set(role.slug, created.id);
  }

  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@thefoundrys.com",
      name: "Foundrys Admin",
      password,
      memberships: {
        create: { organizationId: org.id, role: Role.SUPER_ADMIN },
      },
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "admissions@thefoundrys.com",
      name: "Admissions Manager",
      password,
      memberships: {
        create: { organizationId: org.id, role: Role.ADMISSIONS_MANAGER },
      },
    },
  });

  const counsellor = await prisma.user.create({
    data: {
      email: "counsellor@thefoundrys.com",
      name: "Casey Counsellor",
      password,
      memberships: {
        create: { organizationId: org.id, role: Role.COUNSELOR },
      },
    },
  });

  const contentUploader = await prisma.user.create({
    data: {
      email: "content@thefoundrys.com",
      name: "Chris Content",
      password,
      memberships: {
        create: { organizationId: org.id, role: Role.CONTENT_UPLOADER },
      },
    },
  });

  const student = await prisma.user.create({
    data: {
      email: "student@example.com",
      name: "Sam Student",
      password,
      memberships: {
        create: { organizationId: org.id, role: Role.STUDENT },
      },
    },
  });

  // Memberships were created nested above, so look up their ids to grant roles.
  const seededMemberships = await prisma.membership.findMany({
    where: { organizationId: org.id },
    select: { id: true, userId: true },
  });
  const membershipIdByUser = new Map(
    seededMemberships.map((m) => [m.userId, m.id] as const),
  );

  const seededRoleGrants: [string, string][] = [
    [admin.id, "administrator"],
    [manager.id, "admissions"],
    [counsellor.id, "counsellor"],
    [contentUploader.id, "content-author"],
    [student.id, "member"],
  ];

  await prisma.membershipRole.createMany({
    data: seededRoleGrants.flatMap(([userId, slug]) => {
      const membershipId = membershipIdByUser.get(userId);
      const permissionRoleId = permissionRoleIdBySlug.get(slug);
      return membershipId && permissionRoleId
        ? [{ membershipId, permissionRoleId }]
        : [];
    }),
    skipDuplicates: true,
  });

  const [hyd, wgl] = await Promise.all([
    prisma.campus.create({
      data: {
        organizationId: org.id,
        name: "Hyderabad Campus",
        code: "HYD",
        city: "Hyderabad",
        country: "India",
      },
    }),
    prisma.campus.create({
      data: {
        organizationId: org.id,
        name: "Warangal Campus",
        code: "WGL",
        city: "Warangal",
        country: "India",
      },
    }),
  ]);

  const campusByCode = { HYD: hyd, WGL: wgl } as const;

  const deptSpecs = [
    { name: "School of Artificial Intelligence", code: "AI" },
    { name: "School of Cyber Security", code: "CYBER" },
    { name: "School of Data Science", code: "DS" },
    { name: "School of Blockchain", code: "CHAIN" },
    { name: "School of Quantum Computing", code: "QC" },
    { name: "School of Robotics & IoT", code: "ROBOTICS" },
    { name: "School of ESG & Sustainability", code: "ESG" },
    { name: "School of Renewable Energy", code: "ENERGY" },
    { name: "School of Entrepreneurship", code: "VENTURE" },
    { name: "Faculty Development", code: "EDU" },
    { name: "Executive Education", code: "EXEC" },
    { name: "Advanced Management", code: "AMP" },
  ] as const;

  const departments = await Promise.all(
    deptSpecs.map((d) =>
      prisma.department.create({
        data: {
          organizationId: org.id,
          name: d.name,
          code: d.code,
        },
      }),
    ),
  );
  const deptByCode = Object.fromEntries(departments.map((d) => [d.code!, d]));

  const form = await prisma.formDefinition.create({
    data: {
      organizationId: org.id,
      name: "The Foundry's Inquiry Form",
      description:
        "Lead / registration form — Personal Details, Current Profile, Goals & Learning Preference",
      versions: {
        create: {
          version: 1,
          isPublished: true,
          publishedAt: new Date(),
          schemaJson: JSON.stringify(foundrysInquiryFormSchema()),
        },
      },
    },
  });

  for (const program of FOUNDRYS_PROGRAMS) {
    const campus = program.campusCode ? campusByCode[program.campusCode] : null;
    const department = deptByCode[program.departmentCode];

    await prisma.program.create({
      data: {
        organizationId: org.id,
        campusId: campus?.id ?? null,
        departmentId: department.id,
        formDefinitionId: form.id,
        title: program.name,
        slug: program.slug,
        category: program.category,
        degreeLevel: program.degreeLevel,
        description: program.summary,
        eligibilitySummary: program.eligibilitySummary,
        imageUrl: null,
        price: program.price,
        tuitionCurrency: "INR",
        capacity: program.capacity,
        applicationFee: program.applicationFee,
        requiredDocs: JSON.stringify(program.requiredDocs),
        crmCatalogId: program.crmCatalogId ?? null,
        status: ProgramStatus.PUBLISHED,
        publishedAt: new Date(),
        programKind: program.programKind ?? ProgramKind.COURSE,
        sku: program.sku ?? null,
        duration: program.duration ?? null,
        weeks: program.weeks ?? null,
        durationYears: program.durationYears ?? null,
        semestersPerYear: program.semestersPerYear ?? null,
        level: program.level ?? null,
        type: program.type ?? null,
        location: program.location ?? null,
        specialization: program.specialization ?? null,
        domainSlug: program.domainSlug ?? null,
        isHybridOnly: program.isHybridOnly ?? false,
        requiresEntranceExam: program.requiresEntranceExam ?? false,
        tags: program.tags ?? [],
        learningOutcomes: program.learningOutcomes ?? [],
        pricing: program.pricing ?? undefined,
        ...(program.modules?.length
          ? {
              syllabus: {
                create: {
                  title: program.syllabusTitle ?? "Course outline",
                  description: null,
                  status: SyllabusStatus.PUBLISHED,
                  modules: {
                    create: program.modules.map((mod, moduleIndex) => ({
                      title: mod.title,
                      summary: mod.summary,
                      order: moduleIndex,
                      ...(mod.lessons?.length
                        ? {
                            lessons: {
                              create: mod.lessons.map((lesson, lessonIndex) => ({
                                title: lesson.title,
                                summary: lesson.summary,
                                contentType: lesson.contentType,
                                content: lesson.content,
                                durationMin: lesson.durationMin,
                                order: lessonIndex,
                                isPublished: true,
                              })),
                            },
                          }
                        : {}),
                    })),
                  },
                },
              },
            }
          : {}),
        intakes: {
          create: [
            {
              name: "Fall 2026",
              startDate: new Date("2026-09-01"),
              applicationOpen: new Date("2026-01-01"),
              applicationClose: new Date("2026-07-31"),
              capacity: program.capacity,
              isActive: true,
            },
            {
              name: "Spring 2027",
              startDate: new Date("2027-01-15"),
              applicationOpen: new Date("2026-08-01"),
              applicationClose: new Date("2026-11-30"),
              capacity: Math.round(program.capacity * 0.7),
              isActive: true,
            },
          ],
        },
      },
    });
  }

  const aiProgram = await prisma.program.findFirst({
    where: { organizationId: org.id, slug: "ygp-applied-ai-genai" },
    include: {
      intakes: { where: { isActive: true }, take: 1 },
      syllabus: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: { lessons: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  const formVersion = await prisma.formVersion.findFirst({
    where: { formDefinitionId: form.id, isPublished: true },
  });

    if (aiProgram && formVersion) {
    const enrolledApp = await prisma.application.create({
      data: {
        organizationId: org.id,
        programId: aiProgram.id,
        intakeId: aiProgram.intakes[0]?.id ?? null,
        applicantId: student.id,
        formVersionId: formVersion.id,
        status: ApplicationStatus.ENROLLED,
        answersJson: JSON.stringify({
          full_name: "Sam Student",
          email: "student@example.com",
          phone: "+919999999999",
          date_of_birth: "2002-01-15",
          gender: "male",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500033",
          highest_qualification: "B.Tech",
          stream_specialization: "CSE",
          year_of_passing: "2024",
          college_org: "Example University",
          current_status: "fresher",
          preferred_mode: "hybrid",
          preferred_batch: "weekends",
          heard_about: "website",
          goal_career_start: true,
          declare_true: true,
        }),
        submittedAt: new Date(),
        events: {
          create: [
            {
              toStatus: ApplicationStatus.SUBMITTED,
              note: "Seeded application",
              actorId: student.id,
            },
            {
              fromStatus: ApplicationStatus.SUBMITTED,
              toStatus: ApplicationStatus.ENROLLED,
              note: "Seeded enrolment for Learning demo",
              actorId: manager.id,
            },
          ],
        },
      },
    });

    const enrollment = await prisma.enrollment.create({
      data: {
        organizationId: org.id,
        programId: aiProgram.id,
        userId: student.id,
        status: "ACTIVE",
        enrolledAt: new Date(),
      },
    });

    const firstLesson = aiProgram.syllabus?.modules[0]?.lessons[0];
    if (firstLesson) {
      await prisma.lessonProgress.create({
        data: {
          lessonId: firstLesson.id,
          userId: student.id,
          completedAt: new Date(),
        },
      });
    }

    console.log(
      `Seeded enrolled application ${enrolledApp.id} and enrollment ${enrollment.id} for Learning demo`,
    );

    await prisma.assignment.create({
      data: {
        organizationId: org.id,
        programId: aiProgram.id,
        title: "Intro reflection",
        description:
          "Write a short reflection (at least a few sentences) on what you hope to learn in this Applied AI & GenAI course.",
        dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isPublished: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: student.id,
        title: "Welcome to your course",
        message:
          "You’re enrolled in the YGP in Applied AI & GenAI. Open learning to continue.",
        actionUrl: `/student/learning/${aiProgram.id}`,
      },
    });
  }

  const byCategory = FOUNDRYS_PROGRAMS.reduce(
    (acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log("Seeded The Foundry's published catalogue");
  console.log(`Programs: ${FOUNDRYS_PROGRAMS.length}`);
  console.log("By category:", byCategory);
  console.log("Admin:       admin@thefoundrys.com / password123");
  console.log("Admissions:  admissions@thefoundrys.com / password123");
  console.log("Counsellor:  counsellor@thefoundrys.com / password123");
  console.log("Content:     content@thefoundrys.com / password123");
  console.log(
    "Student:     student@example.com / password123 (ENROLLED in YGP Applied AI & GenAI)",
  );
  console.log(
    `Users: ${admin.email}, ${manager.email}, ${counsellor.email}, ${contentUploader.email}, ${student.email}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
