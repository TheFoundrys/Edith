/**
 * Moodle-inspired learning vocabulary used in the UI.
 * Concepts only — no Moodle code, trademarks as product names, or PHP deps.
 * See README “Learning model” and apps/web/lib/learning/README.md.
 */
export const LEARNING_TERMS = {
  course: "Course",
  courses: "Courses",
  section: "Section",
  sections: "Sections",
  activity: "Activity",
  activities: "Activities",
  completion: "Completion",
  syllabus: "Syllabus",
  enrolled: "Enrolled",
} as const;

/** Internal model → Moodle-like concept (documentation / UI helpers). */
export const LEARNING_MODEL_MAP = {
  Program: "Course (catalog offering)",
  ProgramSyllabus: "Course content outline (published for learners)",
  SyllabusModule: "Section / topic",
  SyllabusLesson: "Activity (resource: text, video URL, or link)",
  LessonProgress: "Activity completion",
  ApplicationENROLLED: "Legacy admissions enrol",
  EnrollmentACTIVE: "Enrolment",
} as const;

/** Learner-facing label for SyllabusLesson.contentType. */
export function activityTypeLabel(contentType: string): string {
  switch (contentType) {
    case "VIDEO_URL":
      return "Video";
    case "EXTERNAL_LINK":
      return "Link";
    case "RICH_TEXT":
    default:
      return "Reading";
  }
}
