// Private runtime barrel for the bundled Feishu extension.
// Keep this barrel thin and generic-only.

export type {
  AllowlistMatch,
  AnyAgentTool,
  BaseProbeResult,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelPlugin,
  HistoryEntry,
  OpenClawConfig,
  OpenClawPluginApi,
  OutboundIdentity,
  PluginRuntime,
  ReplyPayload,
} from "grokbot/plugin-sdk/core";
export type { OpenClawConfig as ClawdbotConfig } from "grokbot/plugin-sdk/core";
export type RuntimeEnv = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  exit: (code: number) => void;
};
export type { GroupToolPolicyConfig } from "grokbot/plugin-sdk/config-contracts";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createActionGate,
  createDedupeCache,
} from "grokbot/plugin-sdk/core";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "grokbot/plugin-sdk/channel-status";
export { buildAgentMediaPayload } from "grokbot/plugin-sdk/agent-media-payload";
export { createChannelPairingController } from "grokbot/plugin-sdk/channel-pairing";
export { createReplyPrefixContext } from "grokbot/plugin-sdk/channel-outbound";
export {
  evaluateSupplementalContextVisibility,
  filterSupplementalContextItems,
  resolveChannelContextVisibilityMode,
} from "grokbot/plugin-sdk/context-visibility-runtime";
export { getSessionEntry } from "grokbot/plugin-sdk/session-store-runtime";
export { readJsonFileWithFallback } from "grokbot/plugin-sdk/json-store";
export { normalizeAgentId } from "grokbot/plugin-sdk/routing";
export { chunkTextForOutbound } from "grokbot/plugin-sdk/text-chunking";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "grokbot/plugin-sdk/webhook-ingress";
export { setFeishuRuntime } from "./src/runtime.js";
