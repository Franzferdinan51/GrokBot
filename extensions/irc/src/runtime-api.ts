// Private runtime barrel for the bundled IRC extension.
// Keep this barrel thin and generic-only.

export type { BaseProbeResult } from "grokbot/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "grokbot/plugin-sdk/channel-core";
export type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
export type { PluginRuntime } from "grokbot/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "grokbot/plugin-sdk/runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyBySenderConfig,
  GroupToolPolicyConfig,
  MarkdownConfig,
} from "grokbot/plugin-sdk/config-contracts";
export type { OutboundReplyPayload } from "grokbot/plugin-sdk/reply-payload";
export { DEFAULT_ACCOUNT_ID } from "grokbot/plugin-sdk/account-id";
export { buildChannelConfigSchema } from "grokbot/plugin-sdk/channel-config-schema";
export {
  PAIRING_APPROVED_MESSAGE,
  buildBaseChannelStatusSummary,
} from "grokbot/plugin-sdk/channel-status";
export { createChannelPairingController } from "grokbot/plugin-sdk/channel-pairing";
export { createAccountStatusSink } from "grokbot/plugin-sdk/channel-outbound";
export { resolveControlCommandGate } from "grokbot/plugin-sdk/command-auth-native";
export { createChannelMessageReplyPipeline } from "grokbot/plugin-sdk/channel-outbound";
export { chunkTextForOutbound } from "grokbot/plugin-sdk/text-chunking";
export {
  deliverFormattedTextWithAttachments,
  formatTextWithAttachmentLinks,
  resolveOutboundMediaUrls,
} from "grokbot/plugin-sdk/reply-payload";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "grokbot/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "grokbot/plugin-sdk/dangerous-name-runtime";
export { logInboundDrop } from "grokbot/plugin-sdk/channel-inbound";
