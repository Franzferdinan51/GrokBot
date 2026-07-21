// Private runtime barrel for the bundled Nextcloud Talk extension.
// Keep this barrel thin and aligned with the local extension surface.

export type { AllowlistMatch } from "grokbot/plugin-sdk/allow-from";
export type { ChannelGroupContext } from "grokbot/plugin-sdk/channel-contract";
export { logInboundDrop } from "grokbot/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "grokbot/plugin-sdk/channel-pairing";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyConfig,
  OpenClawConfig,
} from "grokbot/plugin-sdk/config-contracts";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "grokbot/plugin-sdk/runtime-group-policy";
export { createChannelMessageReplyPipeline } from "grokbot/plugin-sdk/channel-outbound";
export type { OutboundReplyPayload } from "grokbot/plugin-sdk/reply-payload";
export { deliverFormattedTextWithAttachments } from "grokbot/plugin-sdk/reply-payload";
export type { PluginRuntime } from "grokbot/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "grokbot/plugin-sdk/runtime";
export type { SecretInput } from "grokbot/plugin-sdk/secret-input";
export { fetchWithSsrFGuard } from "grokbot/plugin-sdk/ssrf-runtime";
export { setNextcloudTalkRuntime } from "./src/runtime.js";
