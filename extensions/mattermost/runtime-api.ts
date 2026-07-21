// Private runtime barrel for the bundled Mattermost extension.
// Keep this barrel thin and generic-only.

export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelPlugin,
  ChatType,
  HistoryEntry,
  OpenClawConfig,
  OpenClawPluginApi,
  PluginRuntime,
} from "grokbot/plugin-sdk/core";
export type { RuntimeEnv } from "grokbot/plugin-sdk/runtime";
export type { ReplyPayload } from "grokbot/plugin-sdk/reply-runtime";
export type { ModelsProviderData } from "grokbot/plugin-sdk/models-provider-runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmPolicy,
  GroupPolicy,
} from "grokbot/plugin-sdk/config-contracts";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createDedupeCache,
  parseStrictPositiveInteger,
  resolveClientIp,
  isTrustedProxyAddress,
} from "grokbot/plugin-sdk/core";
export { buildComputedAccountStatusSnapshot } from "grokbot/plugin-sdk/channel-status";
export { createAccountStatusSink } from "grokbot/plugin-sdk/channel-outbound";
export { buildAgentMediaPayload } from "grokbot/plugin-sdk/agent-media-payload";
export {
  listSkillCommandsForAgents,
  resolveControlCommandGate,
  resolveStoredModelOverride,
} from "grokbot/plugin-sdk/command-auth-native";
export { buildModelsProviderData } from "grokbot/plugin-sdk/models-provider-runtime";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "grokbot/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "grokbot/plugin-sdk/dangerous-name-runtime";
export { resolveStorePath } from "grokbot/plugin-sdk/session-store-runtime";
export { formatInboundFromLabel } from "grokbot/plugin-sdk/channel-inbound";
export { logInboundDrop } from "grokbot/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "grokbot/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "grokbot/plugin-sdk/channel-outbound";
export { logTypingFailure } from "grokbot/plugin-sdk/channel-feedback";
export { loadOutboundMediaFromUrl } from "grokbot/plugin-sdk/outbound-media";
export { rawDataToString } from "grokbot/plugin-sdk/webhook-ingress";
export { chunkTextForOutbound } from "grokbot/plugin-sdk/text-chunking";
// Legacy map-helper exports stay for older plugin consumers. New message-turn
// code should use createChannelHistoryWindow.
export {
  DEFAULT_GROUP_HISTORY_LIMIT,
  createChannelHistoryWindow,
  buildPendingHistoryContextFromMap,
  clearHistoryEntriesIfEnabled,
  recordPendingHistoryEntryIfEnabled,
} from "grokbot/plugin-sdk/reply-history";
export { normalizeAccountId, resolveThreadSessionKeys } from "grokbot/plugin-sdk/routing";
export { resolveAllowlistMatchSimple } from "grokbot/plugin-sdk/allow-from";
export { registerPluginHttpRoute } from "grokbot/plugin-sdk/webhook-targets";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
} from "grokbot/plugin-sdk/webhook-ingress";
export {
  applyAccountNameToChannelSection,
  applySetupAccountConfigPatch,
  migrateBaseNameToDefaultAccount,
} from "grokbot/plugin-sdk/setup";
export {
  getAgentScopedMediaLocalRoots,
  resolveChannelMediaMaxBytes,
} from "grokbot/plugin-sdk/media-runtime";
export { normalizeProviderId } from "grokbot/plugin-sdk/provider-model-shared";
export { setMattermostRuntime } from "./src/runtime.js";
