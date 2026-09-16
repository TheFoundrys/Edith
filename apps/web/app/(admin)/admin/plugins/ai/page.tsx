import { redirect } from "next/navigation";
import { AiPluginSettingsForm } from "@/components/admin/ai-plugin-settings-form";
import { getAiPluginAdminState } from "@/lib/actions/ai-plugins";
import { isCompassDatabase } from "@/lib/db/profile";

export default async function AdminAiPluginsPage() {
  if (isCompassDatabase()) redirect("/admin");
  const { plugins, state } = await getAiPluginAdminState();

  return (
    <AiPluginSettingsForm
      plugins={plugins}
      initial={{
        pluginId: state.pluginId,
        enabled: state.enabled,
        config: state.config,
        configuredSecretKeys: state.configuredSecretKeys,
      }}
    />
  );
}
