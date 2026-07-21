// Mattermost API module exposes the plugin public contract.
export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChatType,
  HistoryEntry,
  OpenClawConfig,
  OpenClawPluginApi,
  ReplyPayload,
} from "grokbot/plugin-sdk/core";
export type { RuntimeEnv } from "grokbot/plugin-sdk/runtime";
export { resolveAllowlistMatchSimple } from "grokbot/plugin-sdk/allow-from";
export { logInboundDrop } from "grokbot/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "grokbot/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "grokbot/plugin-sdk/channel-outbound";
export { logTypingFailure } from "grokbot/plugin-sdk/channel-feedback";
export { listSkillCommandsForAgents } from "grokbot/plugin-sdk/command-auth-native";
export { buildModelsProviderData } from "grokbot/plugin-sdk/models-provider-runtime";
export { isDangerousNameMatchingEnabled } from "grokbot/plugin-sdk/dangerous-name-runtime";
export {
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "grokbot/plugin-sdk/runtime-group-policy";
export { resolveChannelMediaMaxBytes } from "grokbot/plugin-sdk/media-runtime";
export { loadOutboundMediaFromUrl } from "grokbot/plugin-sdk/outbound-media";
// Legacy map-helper exports stay for older plugin consumers. New message-turn
// code should use createChannelHistoryWindow.
export {
  DEFAULT_GROUP_HISTORY_LIMIT,
  createChannelHistoryWindow,
} from "grokbot/plugin-sdk/reply-history";
export { registerPluginHttpRoute } from "grokbot/plugin-sdk/webhook-targets";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
} from "grokbot/plugin-sdk/webhook-ingress";
export { isTrustedProxyAddress, resolveClientIp } from "grokbot/plugin-sdk/core";
export { parseTcpPort } from "grokbot/plugin-sdk/number-runtime";
