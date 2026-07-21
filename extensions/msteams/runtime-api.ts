// Private runtime barrel for the bundled Microsoft Teams extension.
// Keep this barrel thin and aligned with the local extension surface.

export { DEFAULT_ACCOUNT_ID } from "grokbot/plugin-sdk/account-id";
export type { AllowlistMatch } from "grokbot/plugin-sdk/allow-from";
export {
  mergeAllowlist,
  resolveAllowlistMatchSimple,
  summarizeMapping,
} from "grokbot/plugin-sdk/allow-from";
export type {
  BaseProbeResult,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelOutboundAdapter,
} from "grokbot/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "grokbot/plugin-sdk/channel-core";
export { logTypingFailure } from "grokbot/plugin-sdk/channel-outbound";
export { createChannelPairingController } from "grokbot/plugin-sdk/channel-pairing";
export { resolveToolsBySender } from "grokbot/plugin-sdk/channel-policy";
export { createChannelMessageReplyPipeline } from "grokbot/plugin-sdk/channel-outbound";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "grokbot/plugin-sdk/channel-status";
export {
  buildChannelKeyCandidates,
  normalizeChannelSlug,
  resolveChannelEntryMatchWithFallback,
  resolveNestedAllowlistDecision,
} from "grokbot/plugin-sdk/channel-targets";
export type {
  GroupPolicy,
  GroupToolPolicyConfig,
  MSTeamsChannelConfig,
  MSTeamsCloudName,
  MSTeamsConfig,
  MSTeamsReplyStyle,
  MSTeamsTeamConfig,
  MarkdownTableMode,
  OpenClawConfig,
} from "grokbot/plugin-sdk/config-contracts";
export { isDangerousNameMatchingEnabled } from "grokbot/plugin-sdk/dangerous-name-runtime";
export { resolveDefaultGroupPolicy } from "grokbot/plugin-sdk/runtime-group-policy";
export { withFileLock } from "grokbot/plugin-sdk/file-lock";
export { keepHttpServerTaskAlive } from "grokbot/plugin-sdk/channel-outbound";
export {
  detectMime,
  extensionForMime,
  extractOriginalFilename,
  getFileExtension,
  resolveChannelMediaMaxBytes,
} from "grokbot/plugin-sdk/media-runtime";
export { loadOutboundMediaFromUrl } from "grokbot/plugin-sdk/outbound-media";
export { buildMediaPayload } from "grokbot/plugin-sdk/reply-payload";
export type { ReplyPayload } from "grokbot/plugin-sdk/reply-payload";
export type { PluginRuntime } from "grokbot/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "grokbot/plugin-sdk/runtime";
export type { SsrFPolicy } from "grokbot/plugin-sdk/ssrf-runtime";
export { fetchWithSsrFGuard } from "grokbot/plugin-sdk/ssrf-runtime";
export { normalizeStringEntries } from "grokbot/plugin-sdk/string-normalization-runtime";
export { chunkTextForOutbound } from "grokbot/plugin-sdk/text-chunking";
export { DEFAULT_WEBHOOK_MAX_BODY_BYTES } from "grokbot/plugin-sdk/webhook-ingress";
export { setMSTeamsRuntime } from "./src/runtime.js";
