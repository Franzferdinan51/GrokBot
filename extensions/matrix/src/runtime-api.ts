// Matrix API module exposes the plugin public contract.
export {
  DEFAULT_ACCOUNT_ID,
  normalizeAccountId,
  normalizeOptionalAccountId,
} from "grokbot/plugin-sdk/account-id";
export {
  createActionGate,
  jsonResult,
  readNumberParam,
  readPositiveIntegerParam,
  readReactionParams,
  readStringArrayParam,
  readStringParam,
  ToolAuthorizationError,
} from "grokbot/plugin-sdk/channel-actions";
export { buildChannelConfigSchema } from "grokbot/plugin-sdk/channel-config-schema";
export type { ChannelPlugin } from "grokbot/plugin-sdk/channel-core";
export type {
  BaseProbeResult,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionAdapter,
  ChannelMessageActionContext,
  ChannelMessageActionName,
  ChannelMessageToolDiscovery,
  ChannelOutboundAdapter,
  ChannelResolveKind,
  ChannelResolveResult,
  ChannelToolSend,
} from "grokbot/plugin-sdk/channel-contract";
export {
  formatLocationText,
  toLocationContext,
  type NormalizedLocation,
} from "grokbot/plugin-sdk/channel-inbound";
export { logInboundDrop } from "grokbot/plugin-sdk/channel-inbound";
export { logTypingFailure } from "grokbot/plugin-sdk/channel-outbound";
export { resolveAckReaction } from "grokbot/plugin-sdk/channel-feedback";
export type { ChannelSetupInput } from "grokbot/plugin-sdk/setup";
export type {
  OpenClawConfig,
  ContextVisibilityMode,
  DmPolicy,
  GroupPolicy,
} from "grokbot/plugin-sdk/config-contracts";
export type { GroupToolPolicyConfig } from "grokbot/plugin-sdk/config-contracts";
export type { WizardPrompter } from "grokbot/plugin-sdk/setup";
export type { SecretInput } from "grokbot/plugin-sdk/secret-input";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "grokbot/plugin-sdk/runtime-group-policy";
export {
  addWildcardAllowFrom,
  formatDocsLink,
  hasConfiguredSecretInput,
  mergeAllowFromEntries,
  moveSingleAccountChannelSectionToDefaultAccount,
  promptAccountId,
  promptChannelAccessConfig,
  splitSetupEntries,
} from "grokbot/plugin-sdk/setup";
export type { RuntimeEnv } from "grokbot/plugin-sdk/runtime";
export {
  assertHttpUrlTargetsPrivateNetwork,
  closeDispatcher,
  createPinnedDispatcher,
  isPrivateOrLoopbackHost,
  resolvePinnedHostnameWithPolicy,
  ssrfPolicyFromDangerouslyAllowPrivateNetwork,
  type LookupFn,
  type SsrFPolicy,
} from "grokbot/plugin-sdk/ssrf-runtime";
export {
  ensureConfiguredAcpBindingReady,
  resolveConfiguredAcpBindingRecord,
} from "grokbot/plugin-sdk/acp-binding-runtime";
export {
  buildProbeChannelStatusSummary,
  collectStatusIssuesFromLastError,
  PAIRING_APPROVED_MESSAGE,
} from "grokbot/plugin-sdk/channel-status";
export {
  getSessionBindingService,
  resolveThreadBindingIdleTimeoutMsForChannel,
  resolveThreadBindingMaxAgeMsForChannel,
} from "grokbot/plugin-sdk/conversation-runtime";
export { resolveOutboundSendDep } from "grokbot/plugin-sdk/channel-outbound";
export { resolveAgentIdFromSessionKey } from "grokbot/plugin-sdk/routing";
export { chunkTextForOutbound } from "grokbot/plugin-sdk/text-chunking";
export { createChannelMessageReplyPipeline } from "grokbot/plugin-sdk/channel-outbound";
export { loadOutboundMediaFromUrl } from "grokbot/plugin-sdk/outbound-media";
export { normalizePollInput, type PollInput } from "grokbot/plugin-sdk/poll-runtime";
export { writeJsonFileAtomically } from "grokbot/plugin-sdk/json-store";
export {
  buildChannelKeyCandidates,
  resolveChannelEntryMatch,
} from "grokbot/plugin-sdk/channel-targets";
export { buildTimeoutAbortSignal } from "./matrix/sdk/timeout-abort-signal.js";
export { formatZonedTimestamp } from "grokbot/plugin-sdk/time-runtime";
export type { PluginRuntime, RuntimeLogger } from "grokbot/plugin-sdk/plugin-runtime";
export type { ReplyPayload } from "grokbot/plugin-sdk/reply-runtime";
// resolveMatrixAccountStringValues already comes from the Matrix API barrel.
// Re-exporting auth-precedence here makes TS source loaders define the export twice.
