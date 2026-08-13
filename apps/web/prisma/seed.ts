import bcrypt from "bcryptjs";
import {
  PrismaClient,
  ApplicationStatus,
  CourseLevel,
  CourseType,
  DegreeLevel,
  LessonContentType,
  ProgramCategory,
  ProgramKind,
  ProgramStatus,
  Role,
  SyllabusStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

type SeedLesson = {
  title: string;
  summary: string;
  contentType: LessonContentType;
  content: string;
  durationMin: number;
};

/** One outline entry — a degree year, a certification track, or a CoE pillar. */
type SeedModule = {
  title: string;
  summary: string;
  lessons?: SeedLesson[];
};

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
  price: number | null;
  crmCatalogId?: string | null;
  programKind?: ProgramKind;
  sku?: string | null;
  duration?: string | null;
  weeks?: number | null;
  durationYears?: number | null;
  semestersPerYear?: number | null;
  level?: CourseLevel | null;
  type?: CourseType | null;
  location?: string | null;
  specialization?: string | null;
  /** Source page slug on thefoundrys.com, kept for traceability. */
  domainSlug?: string | null;
  isHybridOnly?: boolean;
  requiresEntranceExam?: boolean;
  tags?: string[];
  learningOutcomes?: string[];
  pricing?: Record<string, { INR: number; USD: number }> | null;
  syllabusTitle?: string;
  modules?: SeedModule[];
};

/** The catalogue publishes one price across every persona tier. */
function flatPricing(INR: number, USD: number) {
  const tier = { INR, USD };
  return {
    original: tier,
    freshers: tier,
    zeroToTwo: tier,
    twoToFive: tier,
  };
}

/** "The Foundry Way" — the shared delivery model for every educator program. */
const FDP_METHODOLOGY: SeedModule[] = [
  {
    title: "Hands-on Workshops",
    summary: "Build models, code bots and design curriculums live.",
  },
  {
    title: "Real-world Tools",
    summary: "Access industry-grade generative AI and VR kits.",
  },
  {
    title: "Community Support",
    summary:
      "Lifetime access to a network of forward-thinking educators.",
  },
];

/** Every Centre of Excellence is delivered against the same four pillars. */
const COE_PILLARS: SeedModule[] = [
  {
    title: "High-Performance Computing",
    summary:
      "Infrastructure for AI, simulation, cybersecurity, data and advanced research workloads.",
  },
  {
    title: "Integrated Labs",
    summary:
      "Applied labs that connect deep tech, entrepreneurship, sustainability and energy.",
  },
  {
    title: "Curriculum & Faculty Enablement",
    summary:
      "Industry-aligned curriculum, train-the-trainer programmes and execution frameworks.",
  },
  {
    title: "Innovation & Industry Collaboration",
    summary:
      "Project studios, research pathways, startup support and enterprise engagement.",
  },
];

/**
 * The Foundry's published catalogue, mirroring thefoundrys.com:
 * Undergraduate degrees (Schools) · YGP · PGP · Fellowship & Executive ·
 * AMP · Faculty Development · Centre of Excellence
 *
 * The YGP and PGP suites are the site's Launchpad and Professional Mastery
 * packages: each bundles a set of certification tracks, seeded here as the
 * programme's curriculum outline.
 */
const FOUNDRYS_PROGRAMS: SeedProgram[] = [
  // ——— Undergraduate degrees (Schools of Thought) ———
  {
    name: "B.Sc / BCA in Artificial Intelligence",
    slug: "bsc-artificial-intelligence",
    campusCode: "HYD",
    departmentCode: "AI",
    category: ProgramCategory.UNDERGRADUATE_DEGREE,
    degreeLevel: DegreeLevel.BACHELORS,
    programKind: ProgramKind.FOUNDATION,
    summary:
      "A 3-year immersive degree merging AI engineering with entrepreneurship. Students architect neural networks, deploy agent systems and ship production-grade AI products before graduation.",
    eligibilitySummary:
      "Grade 12 / Intermediate from any recognised board — MPC, BiPC, CEC, HEC or Arts. Minimum 60% aggregate in core subjects; programming experience is not required.",
    requiredDocs: ["id_proof", "marksheet_12th"],
    capacity: 60,
    applicationFee: 1000,
    price: null,
    duration: "3 Years",
    durationYears: 3,
    semestersPerYear: 2,
    level: CourseLevel.BEGINNER,
    location: "Hyderabad / Warangal",
    specialization: "Artificial Intelligence",
    domainSlug: "ai",
    tags: [
      "Neural Networks",
      "LLMs & Agents",
      "MLOps",
      "Startup Lab",
      "GPU Clusters",
      "Ethics & Safety",
    ],
    learningOutcomes: [
      "Design AI systems instead of model demos",
      "Evaluate failure before deployment",
      "Own AI behaviour, cost and risk",
      "Communicate AI decisions to engineers, leaders and regulators",
    ],
    syllabusTitle: "Academic map",
    modules: [
      {
        title: "Year 1 — Foundations of Intelligence",
        summary:
          "Mathematical foundations, programming from logical zero, and the core concepts of machine learning and neural networks.",
      },
      {
        title: "Year 2 — Engineering & Specialization",
        summary:
          "Applied AI projects, LLM integration and orchestration, model selection and evaluation, and specialization tracks.",
      },
      {
        title: "Year 3 — Mastery & Real-World Impact",
        summary:
          "Industry mentorship, production deployment, governance and reliability, and a venture-grade capstone.",
      },
    ],
  },
  {
    name: "B.Sc in Data Science",
    slug: "bsc-data-science",
    campusCode: "WGL",
    departmentCode: "DS",
    category: ProgramCategory.UNDERGRADUATE_DEGREE,
    degreeLevel: DegreeLevel.BACHELORS,
    programKind: ProgramKind.FOUNDATION,
    summary:
      "A 3-year immersive degree merging advanced analytics with entrepreneurship. Students construct real-time data warehouses, design visualization architectures and deploy robust modelling workflows.",
    eligibilitySummary:
      "Grade 12 / Intermediate from any recognised board — all streams eligible. Minimum 60% aggregate in core subjects; analytics experience is not required.",
    requiredDocs: ["id_proof", "marksheet_12th"],
    capacity: 60,
    applicationFee: 1000,
    price: null,
    duration: "3 Years",
    durationYears: 3,
    semestersPerYear: 2,
    level: CourseLevel.BEGINNER,
    location: "Warangal",
    specialization: "Data Science",
    domainSlug: "datascience",
    tags: [
      "Statistical Inference",
      "Machine Learning",
      "ETL Engineering",
      "Data Visualizations",
      "Big Data Clusters",
      "Predictive Analytics",
    ],
    learningOutcomes: [
      "Construct predictive frameworks instead of static reports",
      "Deploy clean real-time streaming warehouses",
      "Formulate statistical business optimization models",
      "Present clear causal insights to product designers and executives",
    ],
    syllabusTitle: "Academic map",
    modules: [
      {
        title: "Year 1 — Analytics Foundations",
        summary:
          "Statistical thinking, database structure, exploratory data analysis and visualization fundamentals.",
      },
      {
        title: "Year 2 — Machine Learning & Engineering",
        summary:
          "Feature engineering, regression and predictive modelling, ETL warehousing and cloud database scaling.",
      },
      {
        title: "Year 3 — Advanced Modelling & Applications",
        summary:
          "Causal inference, experimental design, real-time pipelines and enterprise-scale data architecture.",
      },
    ],
  },
  {
    name: "B.Sc in Cyber Security",
    slug: "bsc-cyber-security",
    campusCode: "HYD",
    departmentCode: "CYBER",
    category: ProgramCategory.UNDERGRADUATE_DEGREE,
    degreeLevel: DegreeLevel.BACHELORS,
    programKind: ProgramKind.FOUNDATION,
    summary:
      "A 3-year immersive degree merging offensive and defensive security. Graduates leave battle-ready for distributed cloud defence, kernel auditing and real-world intelligence operations.",
    eligibilitySummary:
      "Grade 12 / Intermediate from any recognised board — HEC, MEC, CEC or MPC. Minimum 60% aggregate in core subjects; programming experience is not required.",
    requiredDocs: ["id_proof", "marksheet_12th"],
    capacity: 60,
    applicationFee: 1000,
    price: null,
    duration: "3 Years",
    durationYears: 3,
    semestersPerYear: 2,
    level: CourseLevel.BEGINNER,
    location: "Hyderabad",
    specialization: "Cyber Security",
    domainSlug: "cyber",
    tags: [
      "Penetration Testing",
      "Red Teaming",
      "Malware Analysis",
      "Cloud Security",
      "AI Security",
      "Digital Forensics",
    ],
    learningOutcomes: [
      "Perform end-to-end penetration tests on enterprise networks",
      "Build and operate a Security Operations Center from scratch",
      "Reverse engineer malware and write detection signatures",
      "Secure cloud infrastructure across AWS, Azure and GCP",
      "Detect and respond to AI-powered cyber threats",
      "Graduate with OSCP-level skills and a portfolio of real exploits",
    ],
    syllabusTitle: "Academic map",
    modules: [
      {
        title: "Year 1 — Foundations of Security",
        summary:
          "Networking fundamentals, shell scripting, access control and the core principles of cyber defence.",
      },
      {
        title: "Year 2 — Offensive & Defensive Operations",
        summary:
          "Penetration testing, red teaming, SOC operations, SIEM tooling and incident response.",
      },
      {
        title: "Year 3 — Mastery & Specialization",
        summary:
          "Malware reverse engineering, cloud and AI security, digital forensics and zero-day research.",
      },
    ],
  },
  {
    name: "B.Sc in Quantum Computing",
    slug: "bsc-quantum-computing",
    campusCode: "HYD",
    departmentCode: "QC",
    category: ProgramCategory.UNDERGRADUATE_DEGREE,
    degreeLevel: DegreeLevel.BACHELORS,
    programKind: ProgramKind.FOUNDATION,
    summary:
      "A 3-year immersive degree merging physics, mathematics and computer science. Graduates program superconducting QPUs and design algorithms that explore multiple paths simultaneously.",
    eligibilitySummary:
      "Grade 12 / Intermediate from any recognised board; MPC or equivalent preferred. Minimum 60% aggregate in mathematics and physics.",
    requiredDocs: ["id_proof", "marksheet_12th"],
    capacity: 40,
    applicationFee: 1000,
    price: null,
    duration: "3 Years",
    durationYears: 3,
    semestersPerYear: 2,
    level: CourseLevel.BEGINNER,
    location: "Hyderabad",
    specialization: "Quantum Computing",
    domainSlug: "quantum-computing",
    tags: [
      "Quantum Mechanics",
      "Linear Algebra",
      "Qiskit",
      "BB84 Protocols",
      "VQE & QAOA",
      "Transmon Physics",
    ],
    learningOutcomes: [
      "Write algorithms for superconducting QPUs and trapped-ion processors",
      "Reason about noise, decoherence and error correction",
      "Build hybrid classical-quantum optimization solutions",
      "Secure networks with Quantum Key Distribution",
    ],
    syllabusTitle: "Academic map",
    modules: [
      {
        title: "Year 1 — Mathematical Foundations",
        summary:
          "Linear algebra, complex numbers, Hilbert spaces and the postulates of quantum mechanics.",
      },
      {
        title: "Year 2 — Quantum Circuits & Algorithms",
        summary:
          "Quantum logic gates, Qiskit and QuTiP programming, VQE and QAOA on real hardware.",
      },
      {
        title: "Year 3 — Quantum Communication & Sensing",
        summary:
          "Quantum key distribution, metrology and sensing, post-quantum cryptography and research work.",
      },
    ],
  },
  {
    name: "B.Sc in Blockchain Technology",
    slug: "bsc-blockchain-technology",
    campusCode: "HYD",
    departmentCode: "CHAIN",
    category: ProgramCategory.UNDERGRADUATE_DEGREE,
    degreeLevel: DegreeLevel.BACHELORS,
    programKind: ProgramKind.FOUNDATION,
    summary:
      "A 3-year immersive degree merging distributed systems, cryptography and tokenomics. Graduates leave with protocol engineering credentials, smart contract audit portfolios and zero-knowledge solutions.",
    eligibilitySummary:
      "Grade 12 / Intermediate from any recognised board — all streams eligible. Minimum 60% aggregate in core subjects; cryptography experience is not required.",
    requiredDocs: ["id_proof", "marksheet_12th"],
    capacity: 40,
    applicationFee: 1000,
    price: null,
    duration: "3 Years",
    durationYears: 3,
    semestersPerYear: 2,
    level: CourseLevel.BEGINNER,
    location: "Hyderabad",
    specialization: "Blockchain Technology",
    domainSlug: "blockchain",
    tags: [
      "Distributed Systems",
      "Solidity & Vyper",
      "ZKP Math",
      "Token Economics",
      "Protocol Security",
      "Cross-Chain Bridges",
    ],
    learningOutcomes: [
      "Engineer consensus protocols and peer-to-peer networking layers",
      "Write and security-audit production Solidity contracts",
      "Build zero-knowledge rollups with SNARKs and STARKs",
      "Design sustainable tokenomics and DAO governance models",
    ],
    syllabusTitle: "Academic map",
    modules: [
      {
        title: "Year 1 — Cryptographic Foundations",
        summary:
          "Hash functions, digital signatures, distributed systems and consensus protocol basics.",
      },
      {
        title: "Year 2 — Smart Contracts & VM Architecture",
        summary:
          "Solidity and Vyper, EVM internals, Foundry tooling, dApp development and contract auditing.",
      },
      {
        title: "Year 3 — Scaling & Privacy (ZK)",
        summary:
          "Layer-2 scaling, zero-knowledge proofs, cross-chain bridges and DAO governance design.",
      },
    ],
  },
  {
    name: "B.Sc in ESG & Governance",
    slug: "bsc-esg-governance",
    campusCode: "HYD",
    departmentCode: "ESG",
    category: ProgramCategory.UNDERGRADUATE_DEGREE,
    degreeLevel: DegreeLevel.BACHELORS,
    programKind: ProgramKind.FOUNDATION,
    summary:
      "Master the trinity of modern governance — environmental stewardship, social equity and corporate governance. Learn to design business models that are regenerative by default.",
    eligibilitySummary:
      "Grade 12 / Intermediate from any recognised board — all streams eligible. Minimum 60% aggregate in core subjects.",
    requiredDocs: ["id_proof", "marksheet_12th"],
    capacity: 40,
    applicationFee: 1000,
    price: null,
    duration: "3 Years",
    durationYears: 3,
    semestersPerYear: 2,
    level: CourseLevel.BEGINNER,
    location: "Hyderabad",
    specialization: "ESG & Governance",
    domainSlug: "esg",
    tags: [
      "Carbon Accounting",
      "Green Finance",
      "Corporate Governance",
      "Resource Efficiency",
      "Carbon Markets",
      "Responsible Innovation",
    ],
    learningOutcomes: [
      "Build carbon footprint and resource efficiency models",
      "Structure boards, ethics frameworks and executive pay",
      "Evaluate sustainable investments and carbon markets",
      "Design regenerative, compliance-ready business models",
    ],
    syllabusTitle: "Programme pillars",
    modules: [
      {
        title: "Environmental",
        summary:
          "Carbon footprints, resource efficiency and biodiversity.",
      },
      {
        title: "Social",
        summary: "Labour standards, community impact and DEI.",
      },
      {
        title: "Governance",
        summary: "Board structure, ethics and executive pay.",
      },
      {
        title: "Green Finance",
        summary: "Sustainable investing and carbon markets.",
      },
    ],
  },
  {
    name: "B.Sc in Renewable Energy",
    slug: "bsc-renewable-energy",
    campusCode: "HYD",
    departmentCode: "ENERGY",
    category: ProgramCategory.UNDERGRADUATE_DEGREE,
    degreeLevel: DegreeLevel.BACHELORS,
    programKind: ProgramKind.FOUNDATION,
    summary:
      "Not just panels. A 3-year immersion into smart grids, storage systems and energy policy that graduates energy architects rather than technicians.",
    eligibilitySummary:
      "Grade 12 / Intermediate from any recognised board; MPC or equivalent preferred. Minimum 60% aggregate in mathematics and physics.",
    requiredDocs: ["id_proof", "marksheet_12th"],
    capacity: 40,
    applicationFee: 1000,
    price: null,
    duration: "3 Years",
    durationYears: 3,
    semestersPerYear: 2,
    level: CourseLevel.BEGINNER,
    location: "Hyderabad",
    specialization: "Renewable Energy",
    domainSlug: "renewable-energy",
    tags: [
      "Solar PV Systems",
      "Wind Energy",
      "Grid Modernization",
      "Energy Storage Systems",
      "Energy Auditing",
      "Policy & Law",
    ],
    learningOutcomes: [
      "Design and simulate solar-powered microgrids",
      "Optimize wind farm layouts using fluid dynamics",
      "Model energy storage and grid modernization strategies",
      "Navigate carbon markets, regulation and energy economics",
    ],
    syllabusTitle: "The syllabus",
    modules: [
      {
        title: "Year 1 — Foundations of Energy Systems",
        summary:
          "Thermodynamics, electromagnetism and fluid dynamics, circuit analysis and power electronics, then solar, wind and storage technologies.",
      },
      {
        title: "Year 2 — Advanced Grid & Sustainability",
        summary:
          "Smart grid architecture, distribution networks, energy auditing and circular systems.",
      },
      {
        title: "Year 3 — Innovation & Leadership",
        summary:
          "Energy policy and economics, new harvesting techniques and net-zero system design.",
      },
    ],
  },
  {
    name: "B.Sc in Venture Building",
    slug: "bsc-venture-building",
    campusCode: "HYD",
    departmentCode: "VENTURE",
    category: ProgramCategory.UNDERGRADUATE_DEGREE,
    degreeLevel: DegreeLevel.BACHELORS,
    programKind: ProgramKind.FOUNDATION,
    summary:
      "Stop looking for a job — create them. Master the mechanics of building high-growth, AI-native startups from zero to one.",
    eligibilitySummary:
      "Grade 12 / Intermediate from any recognised board — all streams eligible. Minimum 60% aggregate in core subjects.",
    requiredDocs: ["id_proof", "marksheet_12th"],
    capacity: 40,
    applicationFee: 1000,
    price: null,
    duration: "3 Years",
    durationYears: 3,
    semestersPerYear: 2,
    level: CourseLevel.BEGINNER,
    location: "Hyderabad",
    specialization: "Venture Building",
    domainSlug: "venture-building",
    tags: [
      "Customer Discovery",
      "MVP Delivery",
      "Growth Mechanics",
      "Unit Economics",
      "Team & Culture",
      "Founder Resilience",
    ],
    learningOutcomes: [
      "Validate ideas through customer discovery before building",
      "Engineer culture while hiring the first ten employees",
      "Operate viral growth loops, retention and unit economics",
      "Architect AI-native business logic with agentic workflows",
    ],
    syllabusTitle: "Venture tracks",
    modules: [
      {
        title: "Phase 01 — Zero-to-One (12 Months)",
        summary:
          "The prototype track. Validate your idea, build your MVP and find your first 100 customers with zero ad spend.",
      },
      {
        title: "Phase 02 — Growth Architect (24 Months)",
        summary:
          "The scaling track. Build your team, automate operations with agentic AI and raise seed capital from global partners.",
      },
    ],
  },

  // ——— YGP (Young Graduate Program) · Launchpad suite ———
  {
    name: "Young Graduate Program in Applied AI & GenAI",
    slug: "ygp-applied-ai-genai",
    campusCode: "HYD",
    departmentCode: "AI",
    category: ProgramCategory.YOUNG_POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Build a strong foundation in artificial intelligence. Master neural networks, NLP and computer vision from the ground up to design intelligent, autonomous applications. Bundles all five foundational AI tracks into a single programme and credential.",
    eligibilitySummary:
      "Beginners, undergraduates and freshers. No prior coding experience required.",
    requiredDocs: ["id_proof"],
    capacity: 120,
    applicationFee: 1000,
    price: 149000,
    crmCatalogId: "5a0dc2f4-dfbd-440d-a79a-6360813a4207",
    duration: "12 Months",
    weeks: 52,
    level: CourseLevel.BEGINNER,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Applied AI & GenAI",
    domainSlug: "entry-level-ai",
    pricing: flatPricing(149000, 2000),
    tags: [
      "5 Introductory Tracks Included",
      "Interactive Building Labs",
      "AI Launchpad Credential",
    ],
    learningOutcomes: [
      "AI Engineering Foundations",
      "Prompt Engineering & Design",
      "Large Language Model Basics",
      "Intro to Machine Learning",
      "AI Strategy & Leadership",
    ],
    syllabusTitle: "Certification tracks",
    modules: [
      {
        title: "Getting started",
        summary: "Orientation and how to use Learning.",
        lessons: [
          {
            title: "Welcome & program overview",
            summary: "What you will build and how to succeed.",
            contentType: LessonContentType.RICH_TEXT,
            content: `# Welcome

Welcome to the **Young Graduate Program in Applied AI & GenAI**.

## What you'll do
- Follow each **section** in order
- Open **activities** and mark them complete
- Use **Continue** from Learning to resume`,
            durationMin: 15,
          },
          {
            title: "Campus orientation video",
            summary: "Short intro to the learning environment.",
            contentType: LessonContentType.VIDEO_URL,
            content: "https://www.youtube.com/watch?v=aircAruvnKk",
            durationMin: 10,
          },
        ],
      },
      {
        title: "AI 001 · Certified in AI Research",
        summary:
          "6 Weeks · Dive deep into algorithms and model architectures that power modern AI. Learn how to push the boundaries of intelligent systems through research and experimentation. For data and ML researchers.",
        lessons: [
          {
            title: "Thinking in systems",
            summary: "Mental models for AI products.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Systems thinking

Treat models, data, and product surface as one system.

- Inputs and outputs must be explicit
- Prefer small, shippable increments`,
            durationMin: 20,
          },
          {
            title: "Further reading",
            summary: "External resource pack.",
            contentType: LessonContentType.EXTERNAL_LINK,
            content: "https://testing.thefoundrys.com/programs",
            durationMin: 5,
          },
        ],
      },
      {
        title: "AI 002 · Certified in AI Engineering",
        summary:
          "6 Weeks · Focus on the engineering lifecycle. Learn to build, scale and optimize production-grade AI applications. For software developers.",
      },
      {
        title: "AI 003 · Certified Prompt Engineering",
        summary:
          "2 Weeks · Master the art of communicating with AI. Learn to design and optimize prompts to unlock the full potential of large language models. For students and AI enthusiasts.",
      },
      {
        title: "AI 004 · 0-1 LLM: Certified in Large Language Models",
        summary:
          "8 Weeks · Master the architecture, training and deployment of large language models, from transformer foundations to building complex agentic systems.",
      },
      {
        title: "AI 006 · AI Strategy & Institutional Intelligence",
        summary:
          "9 Weeks · Bridge the gap between AI technology and organizational leadership. Master AI frameworks, deployment strategy, institutional governance and data privacy.",
      },
    ],
  },
  {
    name: "Young Graduate Program in Cybersecurity Analyst",
    slug: "ygp-cybersecurity-analyst",
    campusCode: "HYD",
    departmentCode: "CYBER",
    category: ProgramCategory.YOUNG_POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Learn the core principles of network defence, digital forensics and security audits. Master the foundational tools and strategies required to secure modern business infrastructures.",
    eligibilitySummary:
      "Beginners, undergraduates and freshers. No prior coding experience required.",
    requiredDocs: ["id_proof"],
    capacity: 120,
    applicationFee: 1000,
    price: 199000,
    duration: "12 Months",
    weeks: 52,
    level: CourseLevel.BEGINNER,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Cybersecurity Analyst",
    domainSlug: "entry-level-cyber-security",
    pricing: flatPricing(199000, 2500),
    tags: [
      "5 Introductory Tracks Included",
      "Threat Simulation Sandbox Exercises",
      "Cyber Security Launchpad Credential",
    ],
    learningOutcomes: [
      "Cybersecurity Fundamentals",
      "Ethical Hacking & VAPT",
      "Malware Reverse Engineering",
      "Adversarial AI Defense",
      "Security Operations",
    ],
    syllabusTitle: "Certification tracks",
    modules: [
      {
        title: "CC 001 · Certified in Cyber Security (CC)",
        summary:
          "6 Weeks · Master the (ISC)² cybersecurity domains. Build a strong foundation in network security, access control and security operations.",
      },
      {
        title: "CS 002 · Certified in VAPT for AI",
        summary:
          "6 Weeks · Introduction to vulnerability assessment and penetration testing with a focus on AI components.",
      },
      {
        title: "CS 003 · Certified in Malware Analysis",
        summary:
          "6 Weeks · Learn the art of reverse engineering. Deconstruct malicious software, understand its behaviour and develop defence strategies.",
      },
      {
        title: "CS 004 · Certified in Security for AI",
        summary:
          "6 Weeks · Understand the unique security challenges posed by artificial intelligence and how to mitigate them.",
      },
      {
        title: "CS 005 · Certified in AI Security",
        summary:
          "6 Weeks · Master the core protocols for securing AI systems and protecting neural networks.",
      },
    ],
  },
  {
    name: "Young Graduate Program in Quantum Computing",
    slug: "ygp-quantum-computing",
    campusCode: "HYD",
    departmentCode: "QC",
    category: ProgramCategory.YOUNG_POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Introduce yourself to the computing paradigms of the future. Master qubits, superposition, quantum gates and algorithm design across all eight foundational quantum tracks.",
    eligibilitySummary:
      "Beginners, undergraduates and freshers. No prior coding experience required.",
    requiredDocs: ["id_proof"],
    capacity: 80,
    applicationFee: 1000,
    price: 129000,
    duration: "12 Months",
    weeks: 52,
    level: CourseLevel.BEGINNER,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Quantum Computing",
    domainSlug: "entry-level-quantum-computing",
    pricing: flatPricing(129000, 1800),
    tags: [
      "8 Foundational Tracks Included",
      "Qubits & Circuitry Simulation Labs",
      "Quantum Launchpad Credential",
    ],
    learningOutcomes: [
      "Linear Algebra for Quantum",
      "Postulates of Quantum Mechanics",
      "Basic Quantum Logic Gates",
      "Quantum Key Distribution (QKD)",
      "Post-Quantum Cryptography Basics",
    ],
    syllabusTitle: "Certification tracks",
    modules: [
      {
        title: "Q 001 · Certified in Quantum Fundamentals",
        summary:
          "4 Weeks · From linear algebra to quantum hardware. Master the mathematical postulates, quantum logic and basic circuit design.",
      },
      {
        title: "Q 002 · Certified in Quantum Engineering",
        summary:
          "4 Weeks · Master the physical implementation of qubits and quantum circuitry.",
      },
      {
        title: "Q 003 · Certified in Quantum Computing",
        summary: "4 Weeks · Learn core quantum algorithms and simulation techniques.",
      },
      {
        title: "Q 004 · Certified in Quantum Sensing",
        summary:
          "4 Weeks · Explore high-precision metrology using quantum properties.",
      },
      {
        title: "Q 005 · Certified in Quantum Communication",
        summary: "4 Weeks · Learn secure communication protocols and QKD.",
      },
      {
        title: "Q 006 · Certified in Quantum Information",
        summary:
          "4 Weeks · Information theory re-imagined with entanglement and entropy.",
      },
      {
        title: "Q 007 · Certified in Post Quantum Cryptography",
        summary: "4 Weeks · Preparing classical systems to withstand quantum attacks.",
      },
      {
        title: "QAI 001 · Certified in Quantum Artificial Intelligence",
        summary:
          "4 Weeks · The intersection of two frontiers — quantum machine learning algorithms and neural networks.",
      },
    ],
  },
  {
    name: "Young Graduate Program in Blockchain & Web3",
    slug: "ygp-blockchain-web3",
    campusCode: "HYD",
    departmentCode: "CHAIN",
    category: ProgramCategory.YOUNG_POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Explore decentralized ledger technology. Learn how blockchain protocols, smart contracts and Web3 networks structure trust and digital finance.",
    eligibilitySummary:
      "Beginners, undergraduates and freshers. No prior coding experience required.",
    requiredDocs: ["id_proof"],
    capacity: 100,
    applicationFee: 1000,
    price: 99000,
    duration: "12 Months",
    weeks: 52,
    level: CourseLevel.BEGINNER,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Blockchain & Web3",
    domainSlug: "entry-level-blockchain",
    pricing: flatPricing(99000, 1500),
    tags: [
      "3 Foundational Tracks Included",
      "Smart Contract Audit Sandbox Labs",
      "Web3 Launchpad Credential",
    ],
    learningOutcomes: [
      "Web3 & Blockchain Basics",
      "Decentralized P2P Networks",
      "Solidity Smart Contracts",
      "Non-Fungible Tokens (NFTs)",
      "dApp Frontends & Web3 Providers",
    ],
    syllabusTitle: "Certification tracks",
    modules: [
      {
        title: "BC 001 · Certified in Block Chain",
        summary:
          "6 Weeks · Fundamentals of distributed ledger technology, consensus mechanisms and blockchain architecture basics.",
      },
      {
        title: "BC 002 · Certified in NFT",
        summary:
          "6 Weeks · Introduction to non-fungible tokens, standards and the creative economy on the blockchain.",
      },
      {
        title: "BC 003 · Certified in Decentralized Systems",
        summary:
          "6 Weeks · Understanding decentralized architectures, peer-to-peer networks and distributed computing models.",
      },
    ],
  },

  // ——— PGP (Post Graduate Program) · Professional suite ———
  {
    name: "Post Graduate Program in Applied AI & GenAI",
    slug: "pgp-applied-ai-genai",
    campusCode: "HYD",
    departmentCode: "AI",
    category: ProgramCategory.POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Forge your career through a top-ranked Applied AI & GenAI programme that combines state-of-the-art neural networks with immersive learning. Bundles five premium professional AI tracks into a unified career path.",
    eligibilitySummary:
      "Graduates and working professionals moving into applied AI and GenAI roles.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 80,
    applicationFee: 1500,
    price: 249000,
    duration: "12 Months",
    weeks: 52,
    level: CourseLevel.ADVANCED,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Applied AI & GenAI",
    domainSlug: "professional-ai",
    pricing: flatPricing(249000, 3500),
    tags: [
      "5 Professional Tracks Included",
      "Scale Production-Grade AI Architectures",
      "Expert MLOps & Deployment Credentials",
    ],
    learningOutcomes: [
      "Advanced Neural Nets & SOTA",
      "MLOps & Deployment Lifecycles",
      "Autonomic Agentic AI",
      "High-Performance Model Pipelines",
      "Research-grade Implementations",
    ],
    syllabusTitle: "Certification tracks",
    modules: [
      {
        title: "AI 001 · Certified Professional in AI Research",
        summary:
          "6 Weeks · Master original research in artificial intelligence. An intensive seven-phase programme covering mathematical foundations, SOTA architectures and experimental rigour.",
      },
      {
        title: "AI 002 · Certified Professional in AI Engineering",
        summary:
          "6 Weeks · Focus on the engineering lifecycle. Build, scale and optimize production-grade AI applications.",
      },
      {
        title: "AI 003 · Certified Professional in AI Operations",
        summary:
          "6 Weeks · Master MLOps. Learn deployment strategies, monitoring and maintaining AI at scale. For DevOps and cloud engineers.",
      },
      {
        title: "AI 004 · AI Fluency",
        summary:
          "20 Days · Enable experienced Java developers to build practical AI capabilities using Python, covering language fundamentals, AI frameworks, data preparation, model training and deployment workflows.",
      },
      {
        title: "AI 005 · Agentic AI Bootcamp (Instructor-Led Training)",
        summary:
          "5 Days · An intensive in-person bootcamp in Hyderabad. Build autonomous AI agents with hands-on, instructor-led training and a limited batch size.",
      },
    ],
  },
  {
    name: "Post Graduate Program in Cybersecurity Analyst",
    slug: "pgp-cybersecurity-analyst",
    campusCode: "HYD",
    departmentCode: "CYBER",
    category: ProgramCategory.POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Master both offensive and defensive security strategies required to defend the digital frontier. Build rigorous technical depth in network forensics, penetration testing, security operations and risk auditing.",
    eligibilitySummary:
      "Graduates and working professionals moving into enterprise security roles.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 80,
    applicationFee: 1500,
    price: 299000,
    duration: "12 Months",
    weeks: 52,
    level: CourseLevel.ADVANCED,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Cybersecurity Analyst",
    domainSlug: "professional-cyber-security",
    pricing: flatPricing(299000, 4000),
    tags: [
      "4 Professional Tracks Included",
      "Enterprise-Grade Defensive Sandbox Labs",
      "Advanced Cyber & AI Defense Credentials",
    ],
    learningOutcomes: [
      "Network & Access Architecture",
      "Vulnerability & Pen Testing",
      "Adversarial ML Attack Vectors",
      "Cyber Threat Mitigation",
      "Risk Assessment & Compliance",
    ],
    syllabusTitle: "Certification tracks",
    modules: [
      {
        title: "CS 001 · Certified Professional in Cyber Security",
        summary:
          "3 Months · Comprehensive coverage of network security, ethical hacking and incident response for the enterprise.",
      },
      {
        title: "CS 002 · Certified Professional in VAPT for AI",
        summary:
          "3 Months · Specialized track focusing on vulnerability assessment and penetration testing for AI systems.",
      },
      {
        title: "CS 003 · Certified Professional in Security for AI",
        summary:
          "3 Months · Secure AI pipelines, training data and model endpoints against adversarial attacks.",
      },
      {
        title: "CS 004 · Certified Professional in AI Security",
        summary:
          "3 Months · Advanced studies in securing the AI lifecycle, from data ingestion to inference.",
      },
    ],
  },
  {
    name: "Post Graduate Program in Quantum Computing",
    slug: "pgp-quantum-computing",
    campusCode: "HYD",
    departmentCode: "QC",
    category: ProgramCategory.POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Prepare for the computational paradigm shift. Master qubits, superposition, quantum gates and algorithm design across seven professional quantum engineering and sensing tracks.",
    eligibilitySummary:
      "Graduates and working professionals in technology roles moving into quantum engineering.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 60,
    applicationFee: 1500,
    price: 349000,
    duration: "12 Months",
    weeks: 52,
    level: CourseLevel.ADVANCED,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Quantum Computing",
    domainSlug: "professional-quantum-computing",
    pricing: flatPricing(349000, 4500),
    tags: [
      "7 Professional Tracks Included",
      "Advanced Simulation Sandbox Labs",
      "Quantum Engineer Professional Credentials",
    ],
    learningOutcomes: [
      "Postulates & Circuits",
      "Physical Qubits Implementation",
      "Entanglement Sensing & Metrology",
      "Post-Quantum Lattice Cryptography",
      "Quantum Neural Net Training",
    ],
    syllabusTitle: "Certification tracks",
    modules: [
      {
        title: "Q 001 · Certified Professional in Quantum Engineering",
        summary:
          "3 Months · Hardware-focused track covering quantum gates, circuitry and the physical implementation of qubits.",
      },
      {
        title: "Q 002 · Certified Professional in Quantum Computing",
        summary:
          "3 Months · Core algorithm track including Shor's, Grover's and quantum simulation techniques.",
      },
      {
        title: "Q 003 · Certified Professional in Quantum Sensing",
        summary:
          "3 Months · Explore high-precision metrology and imaging using quantum properties.",
      },
      {
        title: "Q 004 · Certified Professional in Quantum Communication",
        summary:
          "3 Months · Secure communication protocols, quantum key distribution and the quantum internet.",
      },
      {
        title: "Q 005 · Certified Professional in Quantum Information",
        summary:
          "3 Months · Information theory re-imagined — entropy, entanglement and density matrices.",
      },
      {
        title: "Q 006 · Certified Professional in Post Quantum Cryptography",
        summary:
          "3 Months · Preparing classical systems to withstand quantum attacks with lattice-based cryptography.",
      },
      {
        title: "QAI 002 · Certified Professional in Quantum AI",
        summary:
          "3 Months · The intersection of two frontiers — quantum machine learning algorithms and neural networks.",
      },
    ],
  },
  {
    name: "Post Graduate Program in Blockchain & Web3",
    slug: "pgp-blockchain-web3",
    campusCode: "HYD",
    departmentCode: "CHAIN",
    category: ProgramCategory.POST_GRADUATE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Architect the decentralized trust layer of the future. Master distributed ledgers, smart contracts, Web3 protocols and cryptographic scaling to rewrite the rules of ownership.",
    eligibilitySummary:
      "Graduates and working professionals in technology roles moving into Web3 engineering.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 70,
    applicationFee: 1500,
    price: 199000,
    duration: "12 Months",
    weeks: 52,
    level: CourseLevel.ADVANCED,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Blockchain & Web3",
    domainSlug: "professional-blockchain",
    pricing: flatPricing(199000, 2500),
    tags: [
      "3 Professional Tracks Included",
      "Enterprise P2P Network Architecture",
      "Smart Contract Security Auditing",
    ],
    learningOutcomes: [
      "Consensus Protocols",
      "Solidity ERC-721/1155 Standards",
      "dApp Web3 Providers Integration",
      "Decentralized Storage & Compute",
      "Vulnerability Auditing frameworks",
    ],
    syllabusTitle: "Certification tracks",
    modules: [
      {
        title: "BC 001 · Certified Professional in Block Chain",
        summary:
          "3 Months · Fundamentals of distributed ledger technology, consensus mechanisms and blockchain architecture.",
      },
      {
        title: "BC 002 · Certified Professional in NFT",
        summary:
          "3 Months · Deep dive into non-fungible tokens, ERC-721/1155 standards and building marketplace dApps.",
      },
      {
        title: "BC 003 · Certified Professional in Decentralized Systems",
        summary:
          "3 Months · Architecting robust, scalable decentralized applications and understanding the broader ecosystem.",
      },
    ],
  },

  // ——— Fellowship & Executive Programs ———
  {
    name: "MBA in Applied AI & GenAI",
    slug: "mba-applied-ai-genai",
    campusCode: "HYD",
    departmentCode: "EXEC",
    category: ProgramCategory.FELLOW_EXECUTIVE,
    degreeLevel: DegreeLevel.MASTERS,
    programKind: ProgramKind.FOUNDATION,
    summary:
      "The ultimate track for AI architects. Three years of deep intelligence engineering followed by a one-year MBA to scale autonomous ventures. Learn to design, deploy and govern cognitive architectures at board-level scale.",
    eligibilitySummary:
      "Aspiring founders, CTOs and technical leaders ready to build AI-native ventures.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 2500,
    price: null,
    duration: "4 Years (3+1)",
    durationYears: 4,
    semestersPerYear: 2,
    level: CourseLevel.ADVANCED,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Applied AI & GenAI",
    domainSlug: "fellow-executive",
    learningOutcomes: [
      "Design and govern cognitive architectures at enterprise scale",
      "Translate AI capability into capital and board-level decisions",
      "Scale autonomous ventures from research to revenue",
    ],
    syllabusTitle: "Integrated MBA path",
    modules: [
      {
        title: "Years 1–3 — Intelligence Engineering",
        summary:
          "Deep technical grounding in machine learning, generative AI, agentic systems and production deployment.",
      },
      {
        title: "Year 4 — MBA in Venture Scaling",
        summary:
          "Capital strategy, governance, go-to-market and the operating model for scaling autonomous ventures.",
      },
    ],
  },
  {
    name: "MBA in Cybersecurity Venture Building",
    slug: "mba-cybersecurity-venture-building",
    campusCode: "HYD",
    departmentCode: "EXEC",
    category: ProgramCategory.FELLOW_EXECUTIVE,
    degreeLevel: DegreeLevel.MASTERS,
    programKind: ProgramKind.FOUNDATION,
    summary:
      "The defence layer. Three years of cybersecurity engineering followed by a one-year MBA to lead and build security-first global ventures. Master network forensics, penetration testing and strategic tech risk governance.",
    eligibilitySummary:
      "Aspiring founders, CTOs and security leaders ready to build security-first ventures.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 2500,
    price: null,
    duration: "4 Years (3+1)",
    durationYears: 4,
    semestersPerYear: 2,
    level: CourseLevel.ADVANCED,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Cybersecurity Venture Building",
    domainSlug: "fellow-executive",
    learningOutcomes: [
      "Lead network forensics and penetration testing programmes",
      "Own strategic technology risk and governance",
      "Build and fund security-first global ventures",
    ],
    syllabusTitle: "Integrated MBA path",
    modules: [
      {
        title: "Years 1–3 — Cybersecurity Engineering",
        summary:
          "Offensive and defensive security, network forensics, penetration testing and cyber-resilient architecture.",
      },
      {
        title: "Year 4 — MBA in Venture Building",
        summary:
          "Risk governance, capital strategy and building security-first products for global markets.",
      },
    ],
  },
  {
    name: "Delivering in the Age of AI",
    slug: "delivering-in-the-age-of-ai",
    campusCode: "HYD",
    departmentCode: "EXEC",
    category: ProgramCategory.FELLOW_EXECUTIVE,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Where senior tech leaders become system owners. Design, engineer, deploy and govern critical systems in an AI-driven world. Participants are embedded into real, enterprise-grade problem statements and leave with systems-level authority.",
    eligibilitySummary:
      "Senior technology leaders, directors, VPs, architects and security leads, plus founders and CTOs (7–15+ years).",
    requiredDocs: ["id_proof", "resume"],
    capacity: 30,
    applicationFee: 2500,
    price: 100000,
    sku: "EXE 001",
    duration: "2 Days Intensive",
    level: CourseLevel.ADVANCED,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    requiresEntranceExam: true,
    location: "Hitech City, Hyderabad",
    specialization: "Executive Leadership",
    domainSlug: "fellow-executive",
    pricing: {
      original: { INR: 100000, USD: 2000 },
      freshers: { INR: 50000, USD: 1000 },
      zeroToTwo: { INR: 75000, USD: 1500 },
      twoToFive: { INR: 90000, USD: 1800 },
    },
    tags: [
      "Real-world Problem Statements",
      "Industry Recognized Certification",
      "Peer Network Frameworks",
    ],
    learningOutcomes: [
      "Systems-level credibility",
      "Enterprise-facing authority",
      "Optionality: promotion, advisory or venture creation",
    ],
    syllabusTitle: "What we actually do",
    modules: [
      {
        title: "AI Platforms",
        summary:
          "Designing and engineering secure public and private AI platforms for regulated environments.",
      },
      {
        title: "Governance",
        summary: "Governing AI systems under emerging compliance frameworks.",
      },
      {
        title: "Cyber-Resilience",
        summary: "Building cyber-resilient, autonomous response architectures.",
      },
      {
        title: "Legacy Modernization",
        summary: "Re-architecting legacy delivery models for AI-native systems.",
      },
    ],
  },

  // ——— Advanced Management Program ———
  {
    name: "Personalized Transformation Program",
    slug: "amp-personalized-transformation",
    campusCode: null,
    departmentCode: "AMP",
    category: ProgramCategory.ADVANCED_MANAGEMENT,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "A high-touch, one-to-one pathway built around your background, goals, schedule, portfolio and career outcome. Private mentorship, a custom curriculum and career positioning.",
    eligibilitySummary:
      "Professionals and executives seeking private mentorship and a custom premium pathway.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 15,
    applicationFee: 2500,
    price: null,
    duration: "Custom",
    level: CourseLevel.ADVANCED,
    type: CourseType.HYBRID,
    specialization: "Personalized Learning",
    domainSlug: "apply-personalized",
    tags: ["Custom Duration", "Premium", "1:1 Mentorship"],
    learningOutcomes: [
      "A curriculum built around your background and goals",
      "A portfolio positioned for your target role",
      "Direct mentorship from practising industry leaders",
    ],
    syllabusTitle: "How it works",
    modules: [
      {
        title: "Profile evaluation",
        summary:
          "Recorded interest leads to profile evaluation within 48 hours, prioritising ambition and logical clarity over traditional credentials.",
      },
      {
        title: "Pathway design",
        summary:
          "A custom curriculum, schedule and mentor pairing built around your background and target outcome.",
      },
      {
        title: "Portfolio & positioning",
        summary:
          "Project work, portfolio review and career positioning towards your intended role.",
      },
    ],
  },
  {
    name: "Custom Campus Programs",
    slug: "amp-custom-campus-programs",
    campusCode: null,
    departmentCode: "AMP",
    category: ProgramCategory.ADVANCED_MANAGEMENT,
    degreeLevel: DegreeLevel.OTHER,
    summary:
      "Tailored multidisciplinary learning programmes for colleges, universities, enterprises and public institutions, delivered as custom cohorts.",
    eligibilitySummary:
      "Colleges, universities, enterprises and public institutions commissioning custom cohorts.",
    requiredDocs: ["id_proof"],
    capacity: 200,
    applicationFee: 0,
    price: null,
    duration: "Custom",
    type: CourseType.HYBRID,
    specialization: "Institutional Programs",
    domainSlug: "programs",
    tags: ["Custom Cohorts", "Enterprise Ready"],
    syllabusTitle: "Engagement model",
    modules: [
      {
        title: "Curriculum mapping",
        summary:
          "Aligning programme outcomes to your institutional or enterprise capability gaps.",
      },
      {
        title: "Cohort delivery",
        summary:
          "Scheduled cohorts delivered on your campus or virtually, with progress tracking via Skill Compass.",
      },
      {
        title: "Assessment & reporting",
        summary:
          "Assessments, credentials and institutional dashboards for cohort performance.",
      },
    ],
  },

  // ——— Faculty Development Programs (Educators) ———
  {
    name: "AI for Educators: Foundation & Practice",
    slug: "fdp-ai-for-educators",
    campusCode: "HYD",
    departmentCode: "EDU",
    category: ProgramCategory.FACULTY_DEVELOPMENT,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Understand generative AI and how to use it to create lesson plans, grade assessments and personalize learning.",
    eligibilitySummary:
      "School teachers and college faculty integrating AI tools into the classroom.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 60,
    applicationFee: 0,
    price: 50000,
    sku: "EDU 001",
    duration: "Cohort-based",
    level: CourseLevel.BEGINNER,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Faculty Development",
    domainSlug: "educators",
    tags: ["Hybrid", "CPE Credits", "Certification"],
    learningOutcomes: [
      "Create lesson plans with generative AI",
      "Grade and give feedback on assessments faster",
      "Personalize learning paths for individual students",
    ],
    syllabusTitle: "The Foundry Way",
    modules: FDP_METHODOLOGY,
  },
  {
    name: "Integrating Deep Tech in Curriculum",
    slug: "fdp-integrating-deep-tech",
    campusCode: "HYD",
    departmentCode: "EDU",
    category: ProgramCategory.FACULTY_DEVELOPMENT,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Learn how to weave concepts of quantum computing and blockchain into standard STEM subjects.",
    eligibilitySummary:
      "College faculty updating curriculum with quantum, blockchain and applied AI.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 60,
    applicationFee: 0,
    price: 50000,
    sku: "EDU 002",
    duration: "Cohort-based",
    level: CourseLevel.INTERMEDIATE,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Faculty Development",
    domainSlug: "educators",
    tags: ["Hybrid", "CPE Credits", "Certification"],
    learningOutcomes: [
      "Map deep tech concepts onto existing STEM syllabi",
      "Bridge academic theory with current industry practice",
      "Design lab practices for quantum and blockchain topics",
    ],
    syllabusTitle: "The Foundry Way",
    modules: FDP_METHODOLOGY,
  },
  {
    name: "Project-Based Learning & Maker Culture",
    slug: "fdp-project-based-learning",
    campusCode: "HYD",
    departmentCode: "EDU",
    category: ProgramCategory.FACULTY_DEVELOPMENT,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Master the art of facilitating hands-on, project-based learning environments that foster innovation.",
    eligibilitySummary:
      "School teachers and college faculty building maker and project-based learning cultures.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 60,
    applicationFee: 0,
    price: 40000,
    sku: "EDU 003",
    duration: "Cohort-based",
    level: CourseLevel.BEGINNER,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Faculty Development",
    domainSlug: "educators",
    tags: ["Hybrid", "CPE Credits", "Certification"],
    learningOutcomes: [
      "Facilitate hands-on, project-based classrooms",
      "Run build-break-create workshops with industry-grade tools",
      "Assess learning through artefacts rather than recall",
    ],
    syllabusTitle: "The Foundry Way",
    modules: FDP_METHODOLOGY,
  },
  {
    name: "Digital Leadership for School Heads",
    slug: "fdp-digital-leadership",
    campusCode: "HYD",
    departmentCode: "EDU",
    category: ProgramCategory.FACULTY_DEVELOPMENT,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Strategic training for principals and HODs on managing digital transformation and tech-first pedagogy.",
    eligibilitySummary:
      "Principals, HODs and school leaders leading institutional digital transformation.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 0,
    price: 60000,
    sku: "EDU 004",
    duration: "Cohort-based",
    level: CourseLevel.ADVANCED,
    type: CourseType.HYBRID,
    isHybridOnly: true,
    location: "Hitech City, Hyderabad",
    specialization: "Faculty Development",
    domainSlug: "educators",
    tags: ["Hybrid", "CPE Credits", "Certification"],
    learningOutcomes: [
      "Lead digital transformation across an institution",
      "Foster a culture of innovation among faculty",
      "Govern technology investment and tech-first pedagogy",
    ],
    syllabusTitle: "The Foundry Way",
    modules: FDP_METHODOLOGY,
  },

  // ——— Centre of Excellence (CoE) ———
  {
    name: "Centre of Excellence in AI & Data Science",
    slug: "coe-ai-data-science",
    campusCode: "HYD",
    departmentCode: "AI",
    category: ProgramCategory.CENTRE_OF_EXCELLENCE,
    degreeLevel: DegreeLevel.OTHER,
    summary:
      "Establish high-performance computing, specialized AI and data labs, applied curriculum, faculty enablement and multidisciplinary research environments.",
    eligibilitySummary:
      "Colleges, universities and enterprises establishing an AI & Data Science CoE.",
    requiredDocs: ["id_proof"],
    capacity: 15,
    applicationFee: 0,
    price: null,
    duration: "Custom",
    specialization: "AI & Data Science",
    domainSlug: "centre-of-excellence",
    tags: ["High-Performance Computing", "Integrated Labs", "Skill Compass"],
    modules: COE_PILLARS,
  },
  {
    name: "Centre of Excellence in Cybersecurity",
    slug: "coe-cybersecurity",
    campusCode: "HYD",
    departmentCode: "CYBER",
    category: ProgramCategory.CENTRE_OF_EXCELLENCE,
    degreeLevel: DegreeLevel.OTHER,
    summary:
      "Establish SOC labs, threat infrastructure, applied security curriculum and faculty enablement with research and industry pathways.",
    eligibilitySummary:
      "Colleges, universities and enterprises establishing a Cybersecurity CoE.",
    requiredDocs: ["id_proof"],
    capacity: 15,
    applicationFee: 0,
    price: null,
    duration: "Custom",
    specialization: "Cybersecurity",
    domainSlug: "centre-of-excellence",
    tags: ["SOC Labs", "Threat Infrastructure", "Skill Compass"],
    modules: COE_PILLARS,
  },
  {
    name: "Centre of Excellence in Blockchain",
    slug: "coe-blockchain",
    campusCode: "HYD",
    departmentCode: "CHAIN",
    category: ProgramCategory.CENTRE_OF_EXCELLENCE,
    degreeLevel: DegreeLevel.OTHER,
    summary:
      "Establish protocol labs, smart-contract sandboxes, applied Web3 curriculum and industry collaboration pathways.",
    eligibilitySummary:
      "Colleges, universities and enterprises establishing a Blockchain CoE.",
    requiredDocs: ["id_proof"],
    capacity: 15,
    applicationFee: 0,
    price: null,
    duration: "Custom",
    specialization: "Blockchain",
    domainSlug: "centre-of-excellence",
    tags: ["Protocol Labs", "Smart Contract Sandboxes", "Skill Compass"],
    modules: COE_PILLARS,
  },
  {
    name: "Centre of Excellence in Quantum",
    slug: "coe-quantum",
    campusCode: "HYD",
    departmentCode: "QC",
    category: ProgramCategory.CENTRE_OF_EXCELLENCE,
    degreeLevel: DegreeLevel.OTHER,
    summary:
      "Establish quantum simulation infrastructure, applied curriculum, faculty enablement and research collaboration.",
    eligibilitySummary:
      "Colleges, universities and enterprises establishing a Quantum CoE.",
    requiredDocs: ["id_proof"],
    capacity: 15,
    applicationFee: 0,
    price: null,
    duration: "Custom",
    specialization: "Quantum",
    domainSlug: "centre-of-excellence",
    tags: ["Simulation Infrastructure", "Research Collaboration", "Skill Compass"],
    modules: COE_PILLARS,
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
