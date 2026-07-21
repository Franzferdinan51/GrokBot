// Diffs API module exposes the plugin public contract.
export type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
export {
  definePluginEntry,
  type AnyAgentTool,
  type OpenClawPluginApi,
  type OpenClawPluginConfigSchema,
  type OpenClawPluginToolContext,
  type PluginLogger,
} from "grokbot/plugin-sdk/plugin-entry";
export { resolvePreferredOpenClawTmpDir } from "grokbot/plugin-sdk/temp-path";
