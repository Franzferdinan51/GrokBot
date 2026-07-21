// Narrow Matrix monitor helper seam.
// Keep monitor internals off the broad package runtime-api barrel so monitor
// tests and shared workers do not pull unrelated Matrix helper surfaces.

export type { NormalizedLocation } from "grokbot/plugin-sdk/channel-inbound";
export type { PluginRuntime, RuntimeLogger } from "grokbot/plugin-sdk/plugin-runtime";
export type { BlockReplyContext, ReplyPayload } from "grokbot/plugin-sdk/reply-runtime";
export type { MarkdownTableMode, OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "grokbot/plugin-sdk/runtime";
export {
  addAllowlistUserEntriesFromConfigEntry,
  buildAllowlistResolutionSummary,
  canonicalizeAllowlistWithResolvedIds,
  patchAllowlistUsersInConfigEntries,
  summarizeMapping,
} from "grokbot/plugin-sdk/allow-from";
export {
  createReplyPrefixOptions,
  createTypingCallbacks,
} from "grokbot/plugin-sdk/channel-outbound";
export { formatLocationText, toLocationContext } from "grokbot/plugin-sdk/channel-inbound";
export { getAgentScopedMediaLocalRoots } from "grokbot/plugin-sdk/agent-media-payload";
export { logInboundDrop } from "grokbot/plugin-sdk/channel-inbound";
export { logTypingFailure } from "grokbot/plugin-sdk/channel-outbound";
export { buildChannelKeyCandidates } from "grokbot/plugin-sdk/channel-targets";
