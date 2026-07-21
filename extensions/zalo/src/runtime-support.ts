// Zalo plugin module implements runtime support behavior.
export type { ReplyPayload } from "grokbot/plugin-sdk/reply-runtime";
export type { OpenClawConfig, GroupPolicy } from "grokbot/plugin-sdk/config-contracts";
export type { MarkdownTableMode } from "grokbot/plugin-sdk/config-contracts";
export type { BaseTokenResolution } from "grokbot/plugin-sdk/channel-contract";
export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelStatusIssue,
} from "grokbot/plugin-sdk/channel-contract";
export type { SecretInput } from "grokbot/plugin-sdk/secret-input";
export type { ChannelPlugin, PluginRuntime, WizardPrompter } from "grokbot/plugin-sdk/core";
export type { RuntimeEnv } from "grokbot/plugin-sdk/runtime";
export type { OutboundReplyPayload } from "grokbot/plugin-sdk/reply-payload";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createDedupeCache,
  formatPairingApproveHint,
  jsonResult,
  normalizeAccountId,
  readStringParam,
  resolveClientIp,
} from "grokbot/plugin-sdk/core";
export {
  applyAccountNameToChannelSection,
  applySetupAccountConfigPatch,
  buildSingleChannelSecretPromptState,
  mergeAllowFromEntries,
  migrateBaseNameToDefaultAccount,
  promptSingleChannelSecretInput,
  runSingleChannelSecretStep,
  setTopLevelChannelDmPolicyWithAllowFrom,
} from "grokbot/plugin-sdk/setup";
export {
  buildSecretInputSchema,
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
  normalizeSecretInputString,
} from "grokbot/plugin-sdk/secret-input";
export {
  buildTokenChannelStatusSummary,
  PAIRING_APPROVED_MESSAGE,
} from "grokbot/plugin-sdk/channel-status";
export { buildBaseAccountStatusSnapshot } from "grokbot/plugin-sdk/status-helpers";
export { chunkTextForOutbound } from "grokbot/plugin-sdk/text-chunking";
export {
  formatAllowFromLowercase,
  isNormalizedSenderAllowed,
} from "grokbot/plugin-sdk/allow-from";
export { addWildcardAllowFrom } from "grokbot/plugin-sdk/setup";
export { resolveOpenProviderRuntimeGroupPolicy } from "grokbot/plugin-sdk/runtime-group-policy";
export {
  warnMissingProviderGroupPolicyFallbackOnce,
  resolveDefaultGroupPolicy,
} from "grokbot/plugin-sdk/runtime-group-policy";
export { createChannelPairingController } from "grokbot/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "grokbot/plugin-sdk/channel-outbound";
export { logTypingFailure } from "grokbot/plugin-sdk/channel-feedback";
export {
  deliverTextOrMediaReply,
  isNumericTargetId,
  sendPayloadWithChunkedTextAndMedia,
} from "grokbot/plugin-sdk/reply-payload";
export { waitForAbortSignal } from "grokbot/plugin-sdk/runtime";
export {
  applyBasicWebhookRequestGuards,
  createFixedWindowRateLimiter,
  createWebhookAnomalyTracker,
  readJsonWebhookBodyOrReject,
  registerPluginHttpRoute,
  registerWebhookTarget,
  registerWebhookTargetWithPluginRoute,
  resolveWebhookPath,
  resolveWebhookTargetWithAuthOrRejectSync,
  WEBHOOK_ANOMALY_COUNTER_DEFAULTS,
  WEBHOOK_RATE_LIMIT_DEFAULTS,
  withResolvedWebhookRequestPipeline,
} from "grokbot/plugin-sdk/webhook-ingress";
export type {
  RegisterWebhookPluginRouteOptions,
  RegisterWebhookTargetOptions,
} from "grokbot/plugin-sdk/webhook-ingress";
