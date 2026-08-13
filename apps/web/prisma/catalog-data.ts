/**
 * The Foundry's published catalogue — the single source of truth for course
 * content, shared by the development seeder (prisma/seed.ts, destructive) and
 * the production publisher (prisma/publish-catalog.ts, additive).
 *
 * Data only: nothing in this file touches the database.
 */
import {
  CourseLevel,
  CourseType,
  DegreeLevel,
  LessonContentType,
  ProgramCategory,
  ProgramKind,
} from "@prisma/client";

export type SeedLesson = {
  title: string;
  summary: string;
  contentType: LessonContentType;
  content: string;
  durationMin: number;
};

/** One outline entry — a degree year, a certification track, or a CoE pillar. */
export type SeedModule = {
  title: string;
  summary: string;
  lessons?: SeedLesson[];
};

export type SeedProgram = {
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
export const FOUNDRYS_PROGRAMS: SeedProgram[] = [
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

  // ——— Certifications (short, standalone) ———
  {
    name: "Certified Applied AI Practitioner",
    slug: "cert-applied-ai-practitioner",
    campusCode: null,
    departmentCode: "AI",
    category: ProgramCategory.CERTIFICATION,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "A six-week certification that takes you from prompting to shipping: build, evaluate and deploy a production-grade LLM application with cost and safety controls.",
    eligibilitySummary:
      "Open to students and freshers with no prior machine learning background. Basic Python is assumed.",
    requiredDocs: ["id_proof"],
    capacity: 120,
    applicationFee: 0,
    price: 35000,
    sku: "CERT 001",
    duration: "6 Weeks",
    weeks: 6,
    level: CourseLevel.BEGINNER,
    type: CourseType.SELF_PACED,
    specialization: "Applied AI",
    domainSlug: "certifications",
    tags: ["Self-paced", "Capstone Project", "Certification", "LLMs"],
    learningOutcomes: [
      "Ship an LLM application backed by your own data",
      "Evaluate model output instead of trusting a demo",
      "Control token cost, latency and failure modes",
      "Explain the limits of a model to a non-technical stakeholder",
    ],
    pricing: flatPricing(35000, 450),
    syllabusTitle: "Certification track",
    modules: [
      {
        title: "Foundations of Generative AI",
        summary:
          "How transformers actually behave, and why prompting alone stops working.",
        lessons: [
          {
            title: "How language models generate text",
            summary: "Tokens, context windows and sampling.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## From tokens to output

A language model does not "know" facts. It predicts the next **token** given the
context window it can see.

Two consequences follow, and they explain most surprises:

- Anything outside the context window does not exist to the model.
- Sampling settings change the output even when the prompt is identical.`,
            durationMin: 35,
          },
          {
            title: "Prompting patterns that survive contact with users",
            summary: "Structure, examples and explicit failure instructions.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Write prompts like interfaces

State the task, the format and what to do when the model is unsure.

An instruction to say "I don't know" is worth more than another paragraph of
encouragement.`,
            durationMin: 40,
          },
        ],
      },
      {
        title: "Retrieval and Grounding",
        summary:
          "Connect a model to your own documents so answers cite real sources.",
        lessons: [
          {
            title: "Embeddings and vector search",
            summary: "Chunking, indexing and why retrieval quality dominates.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Retrieval decides the answer

Most "the model is wrong" bugs are retrieval bugs. If the right passage never
reaches the context window, no amount of prompt tuning recovers it.

Tune chunk size and retrieval depth before you tune the prompt.`,
            durationMin: 45,
          },
          {
            title: "Building a grounded question-answering service",
            summary: "Wire retrieval into an API endpoint end to end.",
            contentType: LessonContentType.EXTERNAL_LINK,
            content: "https://platform.openai.com/docs/guides/embeddings",
            durationMin: 60,
          },
        ],
      },
      {
        title: "Evaluation, Cost and Deployment",
        summary:
          "Prove the system works, keep it affordable, and put it in production.",
        lessons: [
          {
            title: "Building an evaluation set",
            summary: "Golden answers, regression runs and scoring.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Measure before you ship

Collect thirty real questions with known-good answers. Re-run them on every
prompt or model change.

Without this, "the new prompt feels better" is the only evidence you will have.`,
            durationMin: 45,
          },
          {
            title: "Capstone: deploy and defend your application",
            summary: "Ship the project and present its evaluation results.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Capstone

Deploy your application and present:

1. What it does and who for.
2. Your evaluation set and current scores.
3. Cost per request and the failure modes you found.`,
            durationMin: 90,
          },
        ],
      },
    ],
  },
  {
    name: "Certified Cybersecurity Analyst (SOC)",
    slug: "cert-cybersecurity-analyst",
    campusCode: "HYD",
    departmentCode: "CYBER",
    category: ProgramCategory.CERTIFICATION,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Twelve weeks of live-fire SOC training: triage real alerts, hunt threats across logs and run an incident from detection to written post-mortem.",
    eligibilitySummary:
      "Working professionals in IT, networking or support moving into a security operations role. 2+ years of experience recommended.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 40,
    applicationFee: 0,
    price: 65000,
    sku: "CERT 002",
    duration: "12 Weeks",
    weeks: 12,
    level: CourseLevel.INTERMEDIATE,
    type: CourseType.HYBRID,
    location: "Hitech City, Hyderabad",
    specialization: "Security Operations",
    domainSlug: "certifications",
    tags: ["Live SOC Lab", "Blue Team", "Incident Response", "Certification"],
    learningOutcomes: [
      "Triage and escalate alerts under a real queue",
      "Hunt threats across endpoint, network and identity logs",
      "Run an incident from detection through written post-mortem",
      "Map observed activity to MITRE ATT&CK techniques",
    ],
    pricing: flatPricing(65000, 850),
    syllabusTitle: "Certification track",
    modules: [
      {
        title: "The Security Operations Centre",
        summary:
          "How a SOC is structured, and what an analyst is accountable for.",
        lessons: [
          {
            title: "Alert triage and escalation paths",
            summary: "Severity, false positives and when to wake someone up.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Triage is a queue, not a puzzle

Your job is to decide quickly: benign, needs investigation, or escalate now.

The expensive mistake is not a wrong call. It is an alert nobody looked at.`,
            durationMin: 45,
          },
          {
            title: "Reading logs without drowning",
            summary: "Endpoint, network and identity telemetry side by side.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Correlate three sources

A single log line rarely proves anything. Identity plus endpoint plus network
turns a suspicion into a timeline.`,
            durationMin: 50,
          },
        ],
      },
      {
        title: "Threat Detection and Hunting",
        summary:
          "Move from waiting for alerts to actively looking for intrusions.",
        lessons: [
          {
            title: "MITRE ATT&CK as a working map",
            summary: "Techniques, coverage gaps and detection engineering.",
            contentType: LessonContentType.EXTERNAL_LINK,
            content: "https://attack.mitre.org/",
            durationMin: 40,
          },
          {
            title: "Writing and tuning detection rules",
            summary: "Balance recall against a queue nobody can service.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## A rule that fires constantly is a broken rule

Every detection has a budget: the analyst hours it consumes. Tune against real
traffic and measure the false-positive rate before you deploy it.`,
            durationMin: 55,
          },
        ],
      },
      {
        title: "Incident Response",
        summary: "Contain, eradicate, recover and write it up honestly.",
        lessons: [
          {
            title: "Containment and eradication",
            summary: "Isolate without destroying the evidence you need.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Preserve while you contain

Pulling the network cable stops the bleeding and can also erase volatile
evidence. Capture memory and logs first where the risk allows.`,
            durationMin: 50,
          },
          {
            title: "Capstone: run a full incident",
            summary: "A live-fire scenario in the lab, ending in a post-mortem.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Capstone

You will be given a compromised environment and must produce:

1. A timeline of attacker activity.
2. The techniques used, mapped to ATT&CK.
3. A blameless post-mortem with concrete detection improvements.`,
            durationMin: 120,
          },
        ],
      },
    ],
  },
  {
    name: "Certified Quantum Computing Associate",
    slug: "cert-quantum-computing-associate",
    campusCode: null,
    departmentCode: "QC",
    category: ProgramCategory.CERTIFICATION,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "An eight-week associate certification in gate-model quantum computing: build and run real circuits, and judge honestly where quantum does and does not help.",
    eligibilitySummary:
      "Students, researchers and working professionals with comfort in linear algebra and Python. No physics degree required.",
    requiredDocs: ["id_proof"],
    capacity: 60,
    applicationFee: 0,
    price: 45000,
    sku: "CERT 003",
    duration: "8 Weeks",
    weeks: 8,
    level: CourseLevel.INTERMEDIATE,
    type: CourseType.SELF_PACED,
    specialization: "Quantum Computing",
    domainSlug: "certifications",
    tags: ["Self-paced", "Qiskit", "Real Hardware", "Certification"],
    learningOutcomes: [
      "Build and simulate gate-model circuits",
      "Run a job on real quantum hardware and read the noise",
      "Explain where quantum advantage is real and where it is marketing",
      "Implement the standard teaching algorithms end to end",
    ],
    pricing: flatPricing(45000, 600),
    syllabusTitle: "Certification track",
    modules: [
      {
        title: "Qubits and Circuits",
        summary: "Superposition, entanglement and the gate model, concretely.",
        lessons: [
          {
            title: "From bits to qubits",
            summary: "State vectors, the Bloch sphere and measurement.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Measurement destroys the state

A qubit holds amplitudes until you measure it. Measurement collapses it to a
classical bit, which is why you cannot simply read a quantum computer's
"working memory" mid-calculation.`,
            durationMin: 50,
          },
          {
            title: "Your first circuit in Qiskit",
            summary: "Build a Bell pair and inspect the results.",
            contentType: LessonContentType.EXTERNAL_LINK,
            content: "https://docs.quantum.ibm.com/",
            durationMin: 45,
          },
        ],
      },
      {
        title: "Core Algorithms",
        summary: "The standard algorithms, and what they actually promise.",
        lessons: [
          {
            title: "Grover and Shor without the hype",
            summary: "Real speedups, and the conditions attached to them.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Read the exponent, not the headline

Grover is a quadratic speedup, not an exponential one. Shor is exponential but
needs error-corrected hardware that does not exist yet at scale.

Being precise about this is most of the value you add as an associate.`,
            durationMin: 55,
          },
          {
            title: "Variational algorithms on today's hardware",
            summary: "VQE and QAOA in the noisy, small-device regime.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Hybrid by necessity

Current devices are small and noisy, so the practical pattern is a quantum
circuit inside a classical optimisation loop.`,
            durationMin: 50,
          },
        ],
      },
      {
        title: "Noise and Real Hardware",
        summary: "What changes when you leave the simulator.",
        lessons: [
          {
            title: "Decoherence, gate error and readout error",
            summary: "Why the same circuit gives a different answer each run.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## The simulator lied to you

On hardware, every gate adds error and the qubit decoheres while it waits.
Shorter circuits beat cleverer ones.`,
            durationMin: 45,
          },
          {
            title: "Capstone: run and report on real hardware",
            summary: "Execute your circuit on a device and analyse the gap.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Capstone

Run one algorithm on both a simulator and real hardware, then explain the
difference in the results and what you would change to narrow it.`,
            durationMin: 90,
          },
        ],
      },
    ],
  },
  {
    name: "Certified Blockchain & Web3 Developer",
    slug: "cert-blockchain-web3-developer",
    campusCode: "HYD",
    departmentCode: "CHAIN",
    category: ProgramCategory.CERTIFICATION,
    degreeLevel: DegreeLevel.CERTIFICATE,
    summary:
      "Ten weeks building and auditing smart contracts: ship a full dApp, then break someone else's contract and write up the vulnerability.",
    eligibilitySummary:
      "Working professionals with 2+ years of backend or full-stack development experience.",
    requiredDocs: ["id_proof", "resume"],
    capacity: 50,
    applicationFee: 0,
    price: 55000,
    sku: "CERT 004",
    duration: "10 Weeks",
    weeks: 10,
    level: CourseLevel.INTERMEDIATE,
    type: CourseType.HYBRID,
    location: "Hitech City, Hyderabad",
    specialization: "Blockchain & Web3",
    domainSlug: "certifications",
    tags: ["Solidity", "Smart Contract Audit", "dApp", "Certification"],
    learningOutcomes: [
      "Write, test and deploy Solidity contracts",
      "Audit a contract for the common vulnerability classes",
      "Reason about gas cost as a design constraint",
      "Ship a working dApp against a public testnet",
    ],
    pricing: flatPricing(55000, 700),
    syllabusTitle: "Certification track",
    modules: [
      {
        title: "Chains, Consensus and State",
        summary: "What a blockchain guarantees, and what it does not.",
        lessons: [
          {
            title: "Consensus and finality",
            summary: "Proof of work, proof of stake and reorganisations.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Confirmed is not the same as final

A transaction included in a block can still be reorganised away. Knowing how
many confirmations your application needs is a design decision, not a detail.`,
            durationMin: 45,
          },
          {
            title: "Accounts, state and gas",
            summary: "The EVM execution model from the outside in.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Every operation has a price

Gas is not a fee bolted on afterwards. It is a hard constraint that shapes how
you store data and structure loops.`,
            durationMin: 40,
          },
        ],
      },
      {
        title: "Smart Contract Development",
        summary: "Solidity, testing and deployment against a testnet.",
        lessons: [
          {
            title: "Solidity fundamentals",
            summary: "Types, storage, visibility and events.",
            contentType: LessonContentType.EXTERNAL_LINK,
            content: "https://docs.soliditylang.org/",
            durationMin: 60,
          },
          {
            title: "Testing contracts properly",
            summary: "Unit tests, forked mainnet tests and fuzzing.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## You cannot patch a deployed contract

Immutability means testing is not optional hygiene, it is the only safety net
you get. Fuzz the invariants you actually care about.`,
            durationMin: 55,
          },
        ],
      },
      {
        title: "Security and Auditing",
        summary: "The vulnerability classes that keep draining protocols.",
        lessons: [
          {
            title: "Reentrancy, oracles and access control",
            summary: "The recurring causes behind the largest losses.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Update state before you call out

Reentrancy is old and still profitable. Follow checks-effects-interactions, and
treat any external call as a point where control leaves your contract.`,
            durationMin: 60,
          },
          {
            title: "Capstone: ship a dApp and audit a peer's",
            summary: "Deploy your own, then find a real bug in someone else's.",
            contentType: LessonContentType.RICH_TEXT,
            content: `## Capstone

Two deliverables:

1. A working dApp deployed to a public testnet.
2. A written audit of another participant's contract, with severity ratings and
   a suggested fix for each finding.`,
            durationMin: 120,
          },
        ],
      },
    ],
  },
];
