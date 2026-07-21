// Packed Plugin Sdk Type Smoke script supports GrokBot repository automation.
type PublicPluginSdkModules = [
  typeof import("grokbot/plugin-sdk/core"),
  typeof import("grokbot/plugin-sdk/channel-entry-contract"),
  typeof import("grokbot/plugin-sdk/config-contracts"),
  typeof import("grokbot/plugin-sdk/plugin-entry"),
  typeof import("grokbot/plugin-sdk/runtime-env"),
];

const resolvedModules = null as unknown as PublicPluginSdkModules;

void resolvedModules;
