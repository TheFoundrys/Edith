"use client";

import { useMemo, useState, useTransition } from "react";
import {
  saveAiPluginSettings,
  testAiPluginConnection,
} from "@/lib/actions/ai-plugins";
import type { AiPluginManifest } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export function AiPluginSettingsForm({
  plugins,
  initial,
}: {
  plugins: AiPluginManifest[];
  initial: {
    pluginId: string;
    enabled: boolean;
    config: Record<string, string>;
  };
}) {
  const [pluginId, setPluginId] = useState(initial.pluginId);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [config, setConfig] = useState<Record<string, string>>(initial.config);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(
    () => plugins.find((p) => p.id === pluginId) ?? plugins[0],
    [plugins, pluginId],
  );

  function onPluginChange(nextId: string) {
    setPluginId(nextId);
    setError(null);
    setInfo(null);
  }

  return (
    <div>
      <PageHeader
        title="AI plugins"
        description="Choose and configure the AI provider used for assignment and quiz drafting. Settings are stored per organization — not in environment files."
      />

      <Panel className="p-5 max-w-2xl space-y-5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enable AI drafting plugins
        </label>

        <div>
          <Label htmlFor="pluginId">Active plugin</Label>
          <Select
            id="pluginId"
            value={pluginId}
            onChange={(e) => onPluginChange(e.target.value)}
          >
            {plugins.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          {selected ? (
            <p className="mt-1.5 text-xs text-fg-muted">{selected.description}</p>
          ) : null}
        </div>

        {selected?.fields.map((field) => (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type={field.type === "password" ? "password" : "text"}
              value={config[field.key] ?? ""}
              placeholder={
                field.type === "password" && initial.config[field.key]
                  ? "•••••••• (leave blank to keep)"
                  : field.placeholder
              }
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              autoComplete="off"
            />
            {field.help ? (
              <p className="mt-1 text-xs text-fg-muted">{field.help}</p>
            ) : null}
          </div>
        ))}

        <FieldError>{error}</FieldError>
        {info ? <p className="text-sm text-fg-muted">{info}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            loading={pending}
            onClick={() => {
              setError(null);
              setInfo(null);
              startTransition(async () => {
                const result = await saveAiPluginSettings({
                  pluginId,
                  enabled,
                  config,
                });
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setInfo("Plugin settings saved.");
              });
            }}
          >
            {pending ? "Saving…" : "Save plugin"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={pending}
            onClick={() => {
              setError(null);
              setInfo(null);
              startTransition(async () => {
                const save = await saveAiPluginSettings({
                  pluginId,
                  enabled,
                  config,
                });
                if (save.error) {
                  setError(save.error);
                  return;
                }
                const result = await testAiPluginConnection();
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setInfo(
                  `Connected via ${result.provider}. Sample draft: “${result.sampleTitle}”`,
                );
              });
            }}
          >
            Test connection
          </Button>
        </div>
      </Panel>
    </div>
  );
}
