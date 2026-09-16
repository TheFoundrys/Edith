# AI content plugins

Plugins are registered in code (`lib/ai/plugins/`) and configured per organization
in **Admin → AI plugins**.

Optional server defaults for OptGPT / Ollama (OpenAI-compatible API):

```env
OPTGPT_URL="http://192.168.1.117:8006"
MODEL_NAME="optgpt:7b"
OLLAMA_API_KEY="ollama"
```

These apply when no complete **openai-compatible** config is saved in the admin UI.
`OPTGPT_URL` is normalized to `{url}/v1` for `/chat/completions`.

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
