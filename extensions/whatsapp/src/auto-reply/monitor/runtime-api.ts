// Whatsapp API module exposes the plugin public contract.
export { resolveIdentityNamePrefix } from "grokbot/plugin-sdk/agent-runtime";
export { formatInboundEnvelope } from "grokbot/plugin-sdk/channel-inbound";
export { resolveInboundSessionEnvelopeContext } from "grokbot/plugin-sdk/channel-inbound";
export { toLocationContext } from "grokbot/plugin-sdk/channel-inbound";
export {
  createChannelMessageReplyPipeline,
  resolveChannelMessageSourceReplyDeliveryMode,
} from "grokbot/plugin-sdk/channel-outbound";
export {
  isControlCommandMessage,
  shouldComputeCommandAuthorized,
} from "grokbot/plugin-sdk/command-detection";
export { resolveChannelContextVisibilityMode } from "../config.runtime.js";
export { getAgentScopedMediaLocalRoots } from "grokbot/plugin-sdk/media-runtime";
export type LoadConfigFn = typeof import("../config.runtime.js").getRuntimeConfig;
export {
  buildHistoryContextFromEntries,
  type HistoryEntry,
} from "grokbot/plugin-sdk/reply-history";
export { resolveSendableOutboundReplyParts } from "grokbot/plugin-sdk/reply-payload";
export {
  resolveChunkMode,
  resolveTextChunkLimit,
  type getReplyFromConfig,
  type ReplyPayload,
} from "grokbot/plugin-sdk/reply-runtime";
export {
  resolveInboundLastRouteSessionKey,
  type resolveAgentRoute,
} from "grokbot/plugin-sdk/routing";
export { logVerbose, shouldLogVerbose, type getChildLogger } from "grokbot/plugin-sdk/runtime-env";
export { resolvePinnedMainDmOwnerFromAllowlist } from "grokbot/plugin-sdk/security-runtime";
export { resolveMarkdownTableMode } from "grokbot/plugin-sdk/markdown-table-runtime";
export { jidToE164, normalizeE164 } from "../../text-runtime.js";
