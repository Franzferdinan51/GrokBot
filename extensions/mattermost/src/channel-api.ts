// Mattermost API module exposes the plugin public contract.
export { createAccountStatusSink } from "grokbot/plugin-sdk/channel-outbound";
export type { ChannelPlugin } from "grokbot/plugin-sdk/core";
export { DEFAULT_ACCOUNT_ID } from "grokbot/plugin-sdk/core";
export { chunkTextForOutbound } from "grokbot/plugin-sdk/text-chunking";
