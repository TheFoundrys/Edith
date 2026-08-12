export type AiPluginConfigField = {
  key: string;
  label: string;
  type: "text" | "password" | "url";
  required?: boolean;
  placeholder?: string;
  help?: string;
};

export type AiPluginManifest = {
  id: string;
  name: string;
  description: string;
  /** Config keys this plugin reads from AiPluginSetting.configJson */
  fields: AiPluginConfigField[];
};

export type AssignmentDraft = {
  title: string;
  description: string;
  dueInDays: number | null;
};

export type QuizQuestionDraft = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export type QuizDraft = {
  title: string;
  description: string;
  questions: QuizQuestionDraft[];
};

export type AiGenerateAssignmentInput = {
  programName: string;
  programSummary?: string | null;
  syllabusOutline?: string | null;
  topic?: string | null;
  difficulty?: "intro" | "intermediate" | "advanced";
};

export type AiGenerateQuizInput = {
  programName: string;
  programSummary?: string | null;
  syllabusOutline?: string | null;
  topic?: string | null;
  questionCount?: number;
  difficulty?: "intro" | "intermediate" | "advanced";
};

export type AiTutorMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiTutorInput = {
  programName: string;
  programSummary?: string | null;
  syllabusOutline?: string | null;
  moduleTitle?: string | null;
  moduleSummary?: string | null;
  lessonTitle?: string | null;
  lessonSummary?: string | null;
  lessonContentType?: string | null;
  /** Truncated lesson body for grounding — never invent facts beyond this. */
  lessonContentExcerpt?: string | null;
  messages: AiTutorMessage[];
};

export type AiTutorReply = {
  reply: string;
};

export type AiPort = {
  readonly provider: string;
  generateAssignmentDraft(
    input: AiGenerateAssignmentInput,
  ): Promise<AssignmentDraft>;
  generateQuizDraft(input: AiGenerateQuizInput): Promise<QuizDraft>;
  tutorReply(input: AiTutorInput): Promise<AiTutorReply>;
};

export type AiPluginFactory = (config: Record<string, string>) => AiPort;

export type AiPlugin = {
  manifest: AiPluginManifest;
  create: AiPluginFactory;
};
