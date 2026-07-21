// Private runtime barrel for the bundled Nostr extension.
// Keep this barrel thin and aligned with the local extension surface.

export type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
export { getPluginRuntimeGatewayRequestScope } from "grokbot/plugin-sdk/plugin-runtime";
export type { PluginRuntime } from "grokbot/plugin-sdk/runtime-store";
