// Imessage API module exposes the plugin public contract.
import { formatTrimmedAllowFromEntries } from "grokbot/plugin-sdk/channel-config-helpers";
import { PAIRING_APPROVED_MESSAGE } from "grokbot/plugin-sdk/channel-status";
import {
  DEFAULT_ACCOUNT_ID,
  getChatChannelMeta,
  type ChannelPlugin,
} from "grokbot/plugin-sdk/core";
import { resolveChannelMediaMaxBytes } from "grokbot/plugin-sdk/media-runtime";
import { collectStatusIssuesFromLastError } from "grokbot/plugin-sdk/status-helpers";
import { normalizeIMessageMessagingTarget } from "./normalize.js";
export { chunkTextForOutbound } from "grokbot/plugin-sdk/text-chunking";

export {
  collectStatusIssuesFromLastError,
  DEFAULT_ACCOUNT_ID,
  formatTrimmedAllowFromEntries,
  getChatChannelMeta,
  normalizeIMessageMessagingTarget,
  PAIRING_APPROVED_MESSAGE,
  resolveChannelMediaMaxBytes,
};

export type { ChannelPlugin };
