import { AiPluginSettingsForm } from "@/components/admin/ai-plugin-settings-form";
import { getAiPluginAdminState } from "@/lib/actions/ai-plugins";

export default async function AdminAiPluginsPage() {
  const { plugins, state } = await getAiPluginAdminState();

  return (
    <AiPluginSettingsForm
      plugins={plugins}
      initial={{
        pluginId: state.pluginId,
        enabled: state.enabled,
        config: state.config,
      }}
    />
  );
}
