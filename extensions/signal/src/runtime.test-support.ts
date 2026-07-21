// Signal test support owns cleanup for process-global plugin runtime state.
import type { PluginRuntime } from "grokbot/plugin-sdk/core";
import { createPluginRuntimeStore } from "grokbot/plugin-sdk/runtime-store";

const { clearRuntime } = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "signal",
  errorMessage: "Signal runtime not initialized",
});

export function clearSignalRuntimeForTest(): void {
  clearRuntime();
}
