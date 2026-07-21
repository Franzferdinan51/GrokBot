// Whatsapp plugin module implements group gating behavior.
export {
  implicitMentionKindWhen,
  resolveInboundMentionDecision,
} from "grokbot/plugin-sdk/channel-mention-gating";
export { hasControlCommand } from "grokbot/plugin-sdk/command-detection";
export { createChannelHistoryWindow } from "grokbot/plugin-sdk/reply-history";
export { parseActivationCommand } from "grokbot/plugin-sdk/group-activation";
export { normalizeE164 } from "../../text-runtime.js";
