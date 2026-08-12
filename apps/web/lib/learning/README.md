# Learning model (Moodle-inspired standards)

EDITH Learning follows **common LMS concepts** popularized by platforms such as Moodle (course → section → activity → completion). Implementation is **original** to this repo:

- No Moodle source code, plugins, or PHP runtime
- No Moodle package dependency
- No copying of Moodle UI/assets

## Concept map

| LMS concept | EDITH model | Notes |
| --- | --- | --- |
| Course | `Program` + published `ProgramSyllabus` | Catalog program; syllabus is the learner-facing outline |
| Enrolment | `Application` with status `ENROLLED` | After admissions + fee |
| Section / topic | `SyllabusModule` | Ordered grouping |
| Activity (resource) | `SyllabusLesson` | `RICH_TEXT`, `VIDEO_URL`, or `EXTERNAL_LINK` |
| Activity completion | `LessonProgress.completedAt` | Learner-marked complete |

## Access rules (v1)

- Staff build and publish syllabi under Admin → Syllabus
- Learners see Learning only for **enrolled** programs with a **published** syllabus
- Unpublished activities are hidden from learners
- Staff can view per-learner completion under Syllabus → Progress
- Learners can **Continue** / prev-next through activities and mark completion

## Out of scope (v1)

Quizzes, gradebook, SCORM, xAPI/Tin Can, LTI, competencies, forums, Moodle itself.

## Future scope

Realtime AI tutor / avatar stack (planned beyond text chat):

- Frontend: React + Three.js (or Live2D)
- A/V: LiveKit
- VAD: Silero
- STT: Whisper / faster-whisper
- LLM: organization AI plugin (`Admin → AI plugins`)
- TTS: Piper or Kokoro
- Avatar: OSS HeyGen alternatives / Live2D / Three.js
- Agent backend: Node.js / NestJS

**MVP (shipped):** text lesson tutor on each learning activity, grounded in
live course/syllabus/lesson details via `loadCourseLessonContext` and the org
AI plugin — not env hardcoding and not generic chat without course data.
