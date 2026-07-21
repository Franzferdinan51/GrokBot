// Private runtime barrel for the bundled Google Chat extension.
// Keep this barrel thin and avoid broad plugin-sdk surfaces during bootstrap.

export { DEFAULT_ACCOUNT_ID } from "grokbot/plugin-sdk/account-id";
export {
  createActionGate,
  jsonResult,
  readNumberParam,
  readReactionParams,
  readStringParam,
} from "grokbot/plugin-sdk/channel-actions";
export { buildChannelConfigSchema, GoogleChatConfigSchema } from "./config-api.js";
export type {
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelStatusIssue,
} from "grokbot/plugin-sdk/channel-contract";
export { missingTargetError } from "grokbot/plugin-sdk/channel-feedback";
export {
  createAccountStatusSink,
  runPassiveAccountLifecycle,
} from "grokbot/plugin-sdk/channel-outbound";
export { createChannelPairingController } from "grokbot/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "grokbot/plugin-sdk/channel-outbound";
export { PAIRING_APPROVED_MESSAGE } from "grokbot/plugin-sdk/channel-status";
export { chunkTextForOutbound } from "grokbot/plugin-sdk/text-chunking";
export type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "grokbot/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "grokbot/plugin-sdk/dangerous-name-runtime";
export type { PluginRuntime } from "grokbot/plugin-sdk/runtime-store";
export { fetchWithSsrFGuard } from "grokbot/plugin-sdk/ssrf-runtime";
export type {
  GoogleChatAccountConfig,
  GoogleChatConfig,
} from "grokbot/plugin-sdk/config-contracts";
export { extractToolSend } from "grokbot/plugin-sdk/tool-send";
export { resolveInboundMentionDecision } from "grokbot/plugin-sdk/channel-inbound";
export { resolveWebhookPath } from "grokbot/plugin-sdk/webhook-ingress";
export {
  registerWebhookTargetWithPluginRoute,
  resolveWebhookTargetWithAuthOrReject,
  withResolvedWebhookRequestPipeline,
} from "grokbot/plugin-sdk/webhook-targets";
export {
  createWebhookInFlightLimiter,
  readJsonWebhookBodyOrReject,
  type WebhookInFlightLimiter,
} from "grokbot/plugin-sdk/webhook-request-guards";
export { setGoogleChatRuntime } from "./src/runtime.js";
