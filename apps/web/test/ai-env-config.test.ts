import assert from "node:assert/strict";
import test from "node:test";
import {
  getEnvAiPluginConfig,
  normalizeOpenAiCompatibleBaseUrl,
} from "@/lib/ai/env-config";

test("normalizeOpenAiCompatibleBaseUrl appends /v1", () => {
  assert.equal(
    normalizeOpenAiCompatibleBaseUrl("http://192.168.1.117:8006/"),
    "http://192.168.1.117:8006/v1",
  );
  assert.equal(
    normalizeOpenAiCompatibleBaseUrl("http://localhost:11434/v1"),
    "http://localhost:11434/v1",
  );
});

test("getEnvAiPluginConfig reads OPTGPT_URL and MODEL_NAME", () => {
  process.env.OPTGPT_URL = "http://192.168.1.117:8006";
  process.env.MODEL_NAME = "optgpt:7b";
  delete process.env.OLLAMA_BASE_URL;
  delete process.env.OLLAMA_MODEL;

  const config = getEnvAiPluginConfig();
  assert.ok(config);
  assert.equal(config?.baseUrl, "http://192.168.1.117:8006/v1");
  assert.equal(config?.model, "optgpt:7b");
  assert.equal(config?.apiKey, "ollama");
});
