# AI content plugins

Plugins are registered in code (`lib/ai/plugins/`) and configured per organization
in **Admin → AI plugins**. No `AI_ADAPTER` / `OPENAI_*` environment variables are used.

Capabilities: assignment drafts, quiz drafts, and lesson tutor replies grounded in
live course / syllabus / lesson data (`loadCourseLessonContext`).

## Built-in plugins

| Plugin ID | Purpose |
| --- | --- |
| `mock` | Offline deterministic drafts + tutor (default) |
| `openai-compatible` | OpenAI / Ollama / Groq / any Chat Completions API |

## Add a plugin

1. Implement `AiPlugin` (`manifest` + `create(config)`).
2. Register it in `lib/ai/plugins/registry.ts`.
3. Staff select it under Admin → AI plugins and fill declared fields.
