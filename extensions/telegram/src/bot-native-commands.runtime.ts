// Telegram plugin module implements bot native commands behavior.
export {
  ensureConfiguredBindingRouteReady,
  recordInboundSessionMetaSafe,
} from "grokbot/plugin-sdk/conversation-runtime";
export { getAgentScopedMediaLocalRoots } from "grokbot/plugin-sdk/media-runtime";
export {
  executePluginCommand,
  getPluginCommandSpecs,
  matchPluginCommand,
} from "grokbot/plugin-sdk/plugin-runtime";
export {
  finalizeInboundContext,
  resolveChunkMode,
} from "grokbot/plugin-sdk/reply-dispatch-runtime";
export { resolveThreadSessionKeys } from "grokbot/plugin-sdk/routing";
export { getSessionEntry } from "grokbot/plugin-sdk/session-store-runtime";
