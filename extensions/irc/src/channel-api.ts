// Irc API module exposes the plugin public contract.
export { createAccountStatusSink } from "grokbot/plugin-sdk/channel-outbound";
export { DEFAULT_ACCOUNT_ID } from "grokbot/plugin-sdk/account-id";
export type { ChannelPlugin } from "grokbot/plugin-sdk/channel-core";
export { PAIRING_APPROVED_MESSAGE } from "grokbot/plugin-sdk/channel-status";
export { buildBaseChannelStatusSummary } from "grokbot/plugin-sdk/status-helpers";
export { chunkTextForOutbound } from "grokbot/plugin-sdk/text-chunking";
