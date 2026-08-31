/** Curated alumni stories — sourced from The Foundrys testimonials page. */
export const FOUNDRYS_TESTIMONIALS_URL =
  "https://thefoundrys.com/testimonials";

export type FoundrysTestimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
};

export type HomeTestimonial = {
  id: string;
  name: string;
  image: string | null;
  headline: string | null;
  programTitle: string;
  quote: string;
};

/**
 * Stories published at https://thefoundrys.com/testimonials — condensed for cards
 * while preserving the original voice and attribution.
 */
export const FOUNDRYS_TESTIMONIALS: FoundrysTestimonial[] = [
  {
    id: "manikanta",
    name: "Manikanta",
    role: "AI Researcher",
    quote:
      "I started as a fullstack developer and transitioned into AI research under Vishwanath Akuthota's mentorship. He strips away the noise and builds foundations from scratch — from the math behind neural networks to advanced AI applications.",
  },
  {
    id: "venkata-shiva-ranga-reddy",
    name: "Venkata Shiva Ranga Reddy",
    role: "AI Researcher",
    quote:
      "After graduation, learning AI under Vishwanath made it easy to understand systems and build scalable, efficient architectures. I'm excited to see The Foundrys starting in Warangal — wishing him every success.",
  },
  {
    id: "raju-kalla",
    name: "Raju Kalla",
    role: "Cybersecurity Operations",
    quote:
      "Working at the intersection of application and network security, Vishwanath's mentorship changed my professional journey. His teaching made complex topics like cryptography easy to understand.",
  },
  {
    id: "sai-charan-neeli",
    name: "Sai Charan Neeli",
    role: "Cybersecurity Professional",
    quote:
      "Vishwanath's practical teaching style made complex cybersecurity concepts easy to grasp. He not only teaches concepts but also helps build the right mindset for the field.",
  },
  {
    id: "krishna-prasad-avula",
    name: "Krishna Prasad Avula",
    role: "AI Researcher",
    quote:
      "I had no idea about AI before. Vishwanath guided me step by step from ML basics and system design to building real-world projects with confidence.",
  },
  {
    id: "yamuna-devi-kallakuri",
    name: "Yamuna Devi Kallakuri",
    role: "AI Researcher",
    quote:
      "Learning under Vishwanath gave me a strong foundation in AI. I worked on real applications using LLMs, RAG pipelines, machine learning, and scalable AI systems.",
  },
  {
    id: "sai-pramodu",
    name: "Sai Pramodu",
    role: "Software Developer",
    quote:
      "As a fresher, Vishwanath's learn-while-doing approach made machine learning and model training accessible. That mentorship helped me grow into the developer I am today.",
  },
  {
    id: "veda-bharathi",
    name: "Veda Bharathi Bhagavatula",
    role: "Skill Compass Alumna",
    quote:
      "The experience was efficient and intuitive — I now have a clear understanding of various courses. I'd recommend Skill Compass for curated content structured in a proper format.",
  },
  {
    id: "akshitha-reddy",
    name: "Akshitha Reddy",
    role: "AI Intern",
    quote:
      "Skill Compass helped me dive deep into NLP and LLMs. The AI assistance made learning faster and helped me understand complex topics more easily.",
  },
  {
    id: "hansika",
    name: "Hansika",
    role: "Research Intern",
    quote:
      "The AI-powered assistant and structured learning path made complex full stack projects — including role-based access systems — easier to solve in an interactive way.",
  },
  {
    id: "hriday",
    name: "Hriday",
    role: "AI Intern",
    quote:
      "Skill Compass was a great platform to upskill for the current market. The AI Tutor feature helped me understand concepts better — excellent for anyone positioning themselves in their career.",
  },
  {
    id: "preethika",
    name: "Preethika",
    role: "Web Development Intern",
    quote:
      "The AI chatbot lets you listen and learn from documents. I recommend it to anyone interested in exploring AI and ML topics in a smarter, more interactive way.",
  },
  {
    id: "anirudh",
    name: "Anirudh",
    role: "AI/ML Student",
    quote:
      "As a beginner, the voice assistant that teaches and quizzes after every concept was my favourite feature. I'd recommend Skill Compass to friends and colleagues.",
  },
];

export function getHomeTestimonials(limit?: number): HomeTestimonial[] {
  const source =
    limit != null ? FOUNDRYS_TESTIMONIALS.slice(0, limit) : FOUNDRYS_TESTIMONIALS;

  return source.map((item) => ({
    id: item.id,
    name: item.name,
    image: null,
    headline: item.role,
    programTitle: item.role,
    quote: item.quote,
  }));
}
