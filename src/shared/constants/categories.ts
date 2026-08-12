export type ProgramCategory =
  | "YOUNG_POST_GRADUATE"
  | "POST_GRADUATE"
  | "FELLOW_EXECUTIVE"
  | "ADVANCED_MANAGEMENT"
  | "CENTRE_OF_EXCELLENCE"
  | "OTHER";

export const PROGRAM_CATEGORIES: {
  value: ProgramCategory;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: "YOUNG_POST_GRADUATE",
    label: "YGP (Young Graduate Program)",
    shortLabel: "YGP",
    description:
      "Foundational programmes for students and young graduates in emerging deep tech.",
  },
  {
    value: "POST_GRADUATE",
    label: "PGP (Post Graduate Program)",
    shortLabel: "PGP",
    description:
      "Post graduate programmes for professionals accelerating in AI, Cybersecurity and deep tech.",
  },
  {
    value: "FELLOW_EXECUTIVE",
    label: "Fellowship & Executive Programs",
    shortLabel: "Fellow / Executive",
    description:
      "Fellowship and executive programmes in AI, Cybersecurity, leadership and tech strategy.",
  },
  {
    value: "ADVANCED_MANAGEMENT",
    label: "Advanced Management Program",
    shortLabel: "AMP",
    description:
      "Advanced management programmes in AI, Cybersecurity, digital transformation and general management.",
  },
  {
    value: "CENTRE_OF_EXCELLENCE",
    label: "Centre of Excellence (CoE)",
    shortLabel: "CoE",
    description: "Institutional centres of excellence programmes and partnerships.",
  },
  {
    value: "OTHER",
    label: "Other",
    shortLabel: "Other",
    description: "Other programmes.",
  },
];
