import bcrypt from "bcryptjs";
import {
  PrismaClient,
  ApplicationStatus,
  DegreeLevel,
  LessonContentType,
  ProgramCategory,
  ProgramStatus,
  Role,
  SyllabusStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

type SeedProgram = {
  name: string;
  slug: string;
  campusCode: "HYD" | "WGL" | null;
  departmentCode: string;
  category: ProgramCategory;
  degreeLevel: DegreeLevel;
  summary: string;
  eligibilitySummary: string;
  requiredDocs: string[];
  capacity: number;
  applicationFee: number | null;
  tuitionAmount: number | null;
  crmCatalogId?: string | null;
};

/**
 * Exact catalogue from The Foundry's inquiry / lead form engine:
 * YGP · PGP · Fellowship & Executive · AMP · Centre of Excellence
 */
const FOUNDRYS_PROGRAMS: SeedProgram[] = [
  // ——— YGP (Young Graduate Program) ———
  {
    name: "AI/ML",
    slug: "ygp-ai-ml",
    campusCode: "HYD",
    departmentCode: "AI",
    category: ProgramCategory.YOUNG_POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Young Graduate Program in Artificial Intelligence and Machine Learning — foundations to applied AI for students and early learners.",
    eligibilitySummary: "Students, freshers and young graduates. No prior coding required.",
    requiredDocs: ["id_proof"],
    capacity: 120,
    applicationFee: 1000,
    tuitionAmount: 149000,
    crmCatalogId: "5a0dc2f4-dfbd-440d-a79a-6360813a4207",
  },
  {
    name: "Data Science",
    slug: "ygp-data-science",
    campusCode: "WGL",
    departmentCode: "DS",
    category: ProgramCategory.YOUNG_POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Young Graduate Program in Data Science — analytics, statistics and practical data workflows for beginners.",
    eligibilitySummary: "Students, freshers and young graduates with aptitude for quantitative problem-solving.",
    requiredDocs: ["id_proof"],
    capacity: 100,
    applicationFee: 1000,
    tuitionAmount: null,
  },
  {
    name: "Cybersecurity",
    slug: "ygp-cybersecurity",
    campusCode: "HYD",
    departmentCode: "CYBER",
    category: ProgramCategory.YOUNG_POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Young Graduate Program in Cybersecurity — defensive and offensive foundations for securing networks and data.",
    eligibilitySummary: "Students, freshers and young graduates beginning a career in cybersecurity.",
    requiredDocs: ["id_proof"],
    capacity: 120,
    applicationFee: 1000,
    tuitionAmount: 199000,
  },
  {
    name: "Robotics & IoT",
    slug: "ygp-robotics-iot",
    campusCode: "HYD",
    departmentCode: "ROBOTICS",
    category: ProgramCategory.YOUNG_POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Young Graduate Program in Robotics & IoT — physical systems, sensors and connected devices for emerging tech careers.",
    eligibilitySummary: "Students and young graduates interested in robotics, IoT and physical systems.",
    requiredDocs: ["id_proof"],
    capacity: 80,
    applicationFee: 1000,
    tuitionAmount: null,
  },
  {
    name: "Blockchain",
    slug: "ygp-blockchain",
    campusCode: "HYD",
    departmentCode: "CHAIN",
    category: ProgramCategory.YOUNG_POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Young Graduate Program in Blockchain — decentralized ledgers, smart contracts and Web3 foundations.",
    eligibilitySummary: "Students and young graduates exploring blockchain and decentralized systems.",
    requiredDocs: ["id_proof"],
    capacity: 100,
    applicationFee: 1000,
    tuitionAmount: 99000,
  },
  {
    name: "Quantum",
    slug: "ygp-quantum",
    campusCode: "HYD",
    departmentCode: "QC",
    category: ProgramCategory.YOUNG_POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Young Graduate Program in Quantum — qubits, superposition and foundational quantum computing concepts.",
    eligibilitySummary: "Students and young graduates ready to build foundations in quantum technologies.",
    requiredDocs: ["id_proof"],
    capacity: 80,
    applicationFee: 1000,
    tuitionAmount: 129000,
  },

  // ——— PGP (Post Graduate Program) ———
  {
    name: "AI/ML",
    slug: "pgp-ai-ml",
    campusCode: "HYD",
    departmentCode: "AI",
    category: ProgramCategory.POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Post Graduate Program in Artificial Intelligence and Machine Learning — deep vertical expertise for career transition.",
    eligibilitySummary: "Working professionals seeking AI / ML specialization or career growth.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 80,
    applicationFee: 1500,
    tuitionAmount: 249000,
  },
  {
    name: "Data Science",
    slug: "pgp-data-science",
    campusCode: "WGL",
    departmentCode: "DS",
    category: ProgramCategory.POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Post Graduate Program in Data Science — advanced analytics and applied modelling for professionals.",
    eligibilitySummary: "Working professionals seeking data science specialization or transition.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 80,
    applicationFee: 1500,
    tuitionAmount: null,
  },
  {
    name: "Cybersecurity",
    slug: "pgp-cybersecurity",
    campusCode: "HYD",
    departmentCode: "CYBER",
    category: ProgramCategory.POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Post Graduate Program in Cybersecurity — professional-level security operations, VAPT and AI security.",
    eligibilitySummary: "Working professionals seeking cybersecurity specialization or transition.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 80,
    applicationFee: 1500,
    tuitionAmount: 299000,
  },
  {
    name: "Robotics & IoT",
    slug: "pgp-robotics-iot",
    campusCode: "HYD",
    departmentCode: "ROBOTICS",
    category: ProgramCategory.POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Post Graduate Program in Robotics & IoT — professional depth in physical systems and connected intelligence.",
    eligibilitySummary: "Working professionals seeking robotics / IoT specialization.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 60,
    applicationFee: 1500,
    tuitionAmount: null,
  },
  {
    name: "Blockchain",
    slug: "pgp-blockchain",
    campusCode: "HYD",
    departmentCode: "CHAIN",
    category: ProgramCategory.POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Post Graduate Program in Blockchain — professional blockchain and decentralized systems engineering.",
    eligibilitySummary: "Working professionals seeking blockchain / Web3 specialization.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 70,
    applicationFee: 1500,
    tuitionAmount: 199000,
  },
  {
    name: "Quantum",
    slug: "pgp-quantum",
    campusCode: "HYD",
    departmentCode: "QC",
    category: ProgramCategory.POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Post Graduate Program in Quantum — professional quantum engineering and applied quantum tracks.",
    eligibilitySummary: "Working professionals seeking quantum specialization.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 60,
    applicationFee: 1500,
    tuitionAmount: 349000,
  },

  // ——— Fellowship & Executive Programs ———
  {
    name: "AI/ML",
    slug: "fellowship-in-ai",
    campusCode: "HYD",
    departmentCode: "EXEC",
    category: ProgramCategory.FELLOW_EXECUTIVE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Fellowship in Artificial Intelligence for senior practitioners building systems-level AI capability.",
    eligibilitySummary: "Senior professionals, founders and technical leaders (typically 5+ years).",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 2500,
    tuitionAmount: null,
  },
  {
    name: "Cybersecurity",
    slug: "fellowship-in-cybersecurity",
    campusCode: "HYD",
    departmentCode: "EXEC",
    category: ProgramCategory.FELLOW_EXECUTIVE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Fellowship in Cybersecurity for leaders owning security architecture, risk and cyber-resilience.",
    eligibilitySummary: "Senior security and technology leaders (typically 5+ years).",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 2500,
    tuitionAmount: null,
  },
  {
    name: "AI/ML Leadership",
    slug: "executive-ai-leadership",
    campusCode: "HYD",
    departmentCode: "EXEC",
    category: ProgramCategory.FELLOW_EXECUTIVE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Executive Program in AI Leadership — strategy, governance and enterprise AI transformation for decision-makers.",
    eligibilitySummary: "Executives and senior leaders needing strategic AI fluency.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 2500,
    tuitionAmount: 100000,
  },
  {
    name: "Cyber Leadership",
    slug: "executive-cyber-leadership",
    campusCode: "HYD",
    departmentCode: "EXEC",
    category: ProgramCategory.FELLOW_EXECUTIVE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Executive Program in Cyber Leadership — cyber risk, governance and security strategy for business leaders.",
    eligibilitySummary: "Executives and senior leaders responsible for cyber risk and resilience.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 2500,
    tuitionAmount: null,
  },
  {
    name: "Tech Strategy",
    slug: "executive-tech-strategy",
    campusCode: "HYD",
    departmentCode: "EXEC",
    category: ProgramCategory.FELLOW_EXECUTIVE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Executive Program in Tech Strategy — aligning technology architecture with board-level business outcomes.",
    eligibilitySummary: "CTOs, VPs, product and technology leaders shaping enterprise tech strategy.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 2500,
    tuitionAmount: null,
  },

  // ——— Advanced Management Program ———
  {
    name: "AI/ML",
    slug: "amp-ai",
    campusCode: null,
    departmentCode: "AMP",
    category: ProgramCategory.ADVANCED_MANAGEMENT,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Advanced Management Program in AI — leadership, analytics and AI-enabled business transformation.",
    eligibilitySummary: "Managers and professionals (typically 8+ years) driving AI-led change.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 2500,
    tuitionAmount: null,
  },
  {
    name: "Cybersecurity",
    slug: "amp-cybersecurity",
    campusCode: null,
    departmentCode: "AMP",
    category: ProgramCategory.ADVANCED_MANAGEMENT,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Advanced Management Program in Cybersecurity — managing cyber risk, compliance and security investment.",
    eligibilitySummary: "Managers and professionals (typically 8+ years) owning cyber and risk outcomes.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 2500,
    tuitionAmount: null,
  },
  {
    name: "Digital Transformation",
    slug: "amp-digital-transformation",
    campusCode: null,
    departmentCode: "AMP",
    category: ProgramCategory.ADVANCED_MANAGEMENT,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Advanced Management Program in Digital Transformation — business models, analytics, AI and innovation.",
    eligibilitySummary: "Managers and professionals leading digital transformation (typically 10+ years).",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 2500,
    tuitionAmount: 315000,
  },
  {
    name: "General Management Program",
    slug: "amp-general-management",
    campusCode: null,
    departmentCode: "AMP",
    category: ProgramCategory.ADVANCED_MANAGEMENT,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "General Management Program — cross-functional leadership for managers operating in technology-led organizations.",
    eligibilitySummary: "Managers seeking broad advanced management capability.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 2500,
    tuitionAmount: null,
  },

  // ——— Centre of Excellence (CoE) ———
  {
    name: "AI & Data Science",
    slug: "coe-ai-data-science",
    campusCode: "HYD",
    departmentCode: "AI",
    category: ProgramCategory.CENTRE_OF_EXCELLENCE,
    degreeLevel: DegreeLevel.OTHER,
    summary:
      "Centre of Excellence in AI & Data Science — HPC, labs, curriculum enablement and industry research pathways.",
    eligibilitySummary:
      "Colleges, universities and enterprises establishing an AI & Data Science CoE.",
    requiredDocs: ["id_proof"],
    capacity: 15,
    applicationFee: 0,
    tuitionAmount: null,
  },
  {
    name: "Cybersecurity",
    slug: "coe-cybersecurity",
    campusCode: "HYD",
    departmentCode: "CYBER",
    category: ProgramCategory.CENTRE_OF_EXCELLENCE,
    degreeLevel: DegreeLevel.OTHER,
    summary:
      "Centre of Excellence in Cybersecurity — SOC labs, threat infrastructure and faculty enablement.",
    eligibilitySummary:
      "Colleges, universities and enterprises establishing a Cybersecurity CoE.",
    requiredDocs: ["id_proof"],
    capacity: 15,
    applicationFee: 0,
    tuitionAmount: null,
  },
  {
    name: "Blockchain",
    slug: "coe-blockchain",
    campusCode: "HYD",
    departmentCode: "CHAIN",
    category: ProgramCategory.CENTRE_OF_EXCELLENCE,
    degreeLevel: DegreeLevel.OTHER,
    summary:
      "Centre of Excellence in Blockchain — protocol labs, smart-contract sandboxes and industry collaboration.",
    eligibilitySummary:
      "Colleges, universities and enterprises establishing a Blockchain CoE.",
    requiredDocs: ["id_proof"],
    capacity: 15,
    applicationFee: 0,
    tuitionAmount: null,
  },
  {
    name: "Quantum",
    slug: "coe-quantum",
    campusCode: "HYD",
    departmentCode: "QC",
    category: ProgramCategory.CENTRE_OF_EXCELLENCE,
    degreeLevel: DegreeLevel.OTHER,
    summary:
      "Centre of Excellence in Quantum — simulation infrastructure, curriculum and research collaboration.",
    eligibilitySummary:
      "Colleges, universities and enterprises establishing a Quantum CoE.",
    requiredDocs: ["id_proof"],
    capacity: 15,
    applicationFee: 0,
    tuitionAmount: null,
  },
];

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
  await prisma.membership.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: {
      name: "The Foundry's",
      slug: "the-foundrys",
      primaryColor: "#111111",
      timezone: "Asia/Kolkata",
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@thefoundrys.com",
      name: "Foundrys Admin",
      passwordHash,
      memberships: {
        create: { organizationId: org.id, role: Role.SUPER_ADMIN },
      },
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "admissions@thefoundrys.com",
      name: "Admissions Manager",
      passwordHash,
      memberships: {
        create: { organizationId: org.id, role: Role.ADMISSIONS_MANAGER },
      },
    },
  });

  const counsellor = await prisma.user.create({
    data: {
      email: "counsellor@thefoundrys.com",
      name: "Casey Counsellor",
      passwordHash,
      memberships: {
        create: { organizationId: org.id, role: Role.COUNSELOR },
      },
    },
  });

  const contentUploader = await prisma.user.create({
    data: {
      email: "content@thefoundrys.com",
      name: "Chris Content",
      passwordHash,
      memberships: {
        create: { organizationId: org.id, role: Role.CONTENT_UPLOADER },
      },
    },
  });

  const student = await prisma.user.create({
    data: {
      email: "student@example.com",
      name: "Sam Student",
      passwordHash,
      memberships: {
        create: { organizationId: org.id, role: Role.STUDENT },
      },
    },
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
        name: program.name,
        slug: program.slug,
        category: program.category,
        degreeLevel: program.degreeLevel,
        summary: program.summary,
        eligibilitySummary: program.eligibilitySummary,
        imageUrl: null,
        tuitionAmount: program.tuitionAmount,
        tuitionCurrency: "INR",
        capacity: program.capacity,
        applicationFee: program.applicationFee,
        requiredDocs: JSON.stringify(program.requiredDocs),
        crmCatalogId: program.crmCatalogId ?? null,
        status: ProgramStatus.PUBLISHED,
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
        ...(program.slug === "ygp-ai-ml"
          ? {
              syllabus: {
                create: {
                  title: "AI / ML Foundations",
                  description:
                    "Published demo course: orientation, foundations, and external resources.",
                  status: SyllabusStatus.PUBLISHED,
                  modules: {
                    create: [
                      {
                        title: "Getting started",
                        summary: "Orientation and how to use Learning.",
                        sortOrder: 0,
                        lessons: {
                          create: [
                            {
                              title: "Welcome & program overview",
                              summary: "What you will build and how to succeed.",
                              contentType: LessonContentType.RICH_TEXT,
                              contentBody: `# Welcome

Welcome to the **YGP AI / ML** programme.

## What you'll do
- Follow each **section** in order
- Open **activities** and mark them complete
- Use **Continue** from Learning to resume`,
                              durationMin: 15,
                              sortOrder: 0,
                              isPublished: true,
                            },
                            {
                              title: "Campus orientation video",
                              summary: "Short intro to the learning environment.",
                              contentType: LessonContentType.VIDEO_URL,
                              contentBody:
                                "https://www.youtube.com/watch?v=aircAruvnKk",
                              durationMin: 10,
                              sortOrder: 1,
                              isPublished: true,
                            },
                          ],
                        },
                      },
                      {
                        title: "Foundations",
                        summary: "Core concepts and further reading.",
                        sortOrder: 1,
                        lessons: {
                          create: [
                            {
                              title: "Thinking in systems",
                              summary: "Mental models for AI products.",
                              contentType: LessonContentType.RICH_TEXT,
                              contentBody: `## Systems thinking

Treat models, data, and product surface as one system.

- Inputs and outputs must be explicit
- Prefer small, shippable increments`,
                              durationMin: 20,
                              sortOrder: 0,
                              isPublished: true,
                            },
                            {
                              title: "Further reading",
                              summary: "External resource pack.",
                              contentType: LessonContentType.EXTERNAL_LINK,
                              contentBody: "https://testing.thefoundrys.com/programs",
                              durationMin: 5,
                              sortOrder: 1,
                              isPublished: true,
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            }
          : {}),
      },
    });
  }

  const aiProgram = await prisma.program.findFirst({
    where: { organizationId: org.id, slug: "ygp-ai-ml" },
    include: {
      intakes: { where: { isActive: true }, take: 1 },
      syllabus: {
        include: {
          modules: {
            orderBy: { sortOrder: "asc" },
            include: { lessons: { orderBy: { sortOrder: "asc" } } },
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
          "Write a short reflection (at least a few sentences) on what you hope to learn in this AI / ML course.",
        dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isPublished: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: student.id,
        title: "Welcome to your course",
        body: "You’re enrolled in YGP AI / ML. Open learning to continue.",
        href: `/student/learning/${aiProgram.id}`,
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

  console.log("Seeded The Foundry's inquiry-form catalogue");
  console.log(`Programs: ${FOUNDRYS_PROGRAMS.length}`);
  console.log("By category:", byCategory);
  console.log("Admin:       admin@thefoundrys.com / password123");
  console.log("Admissions:  admissions@thefoundrys.com / password123");
  console.log("Counsellor:  counsellor@thefoundrys.com / password123");
  console.log("Content:     content@thefoundrys.com / password123");
  console.log("Student:     student@example.com / password123 (ENROLLED in YGP AI / ML)");
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
