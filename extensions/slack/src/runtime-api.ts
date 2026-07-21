// Slack API module exposes the plugin public contract.
export {
  buildComputedAccountStatusSnapshot,
  PAIRING_APPROVED_MESSAGE,
  projectCredentialSnapshotFields,
  resolveConfiguredFromRequiredCredentialStatuses,
} from "grokbot/plugin-sdk/channel-status";
export { buildChannelConfigSchema, SlackConfigSchema } from "../config-api.js";
export type { ChannelMessageActionContext } from "grokbot/plugin-sdk/channel-contract";
export { DEFAULT_ACCOUNT_ID } from "grokbot/plugin-sdk/account-id";
export type {
  ChannelPlugin,
  OpenClawPluginApi,
  PluginRuntime,
} from "grokbot/plugin-sdk/channel-plugin-common";
export type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
export type { SlackAccountConfig } from "grokbot/plugin-sdk/config-contracts";
export {
  emptyPluginConfigSchema,
  formatPairingApproveHint,
} from "grokbot/plugin-sdk/channel-plugin-common";
export { loadOutboundMediaFromUrl } from "grokbot/plugin-sdk/outbound-media";
export { looksLikeSlackTargetId, normalizeSlackMessagingTarget } from "./target-parsing.js";
export { getChatChannelMeta } from "./channel-api.js";
export {
  createActionGate,
  imageResultFromFile,
  jsonResult,
  readNumberParam,
  readPositiveIntegerParam,
  readReactionParams,
  readStringParam,
  withNormalizedTimestamp,
} from "grokbot/plugin-sdk/channel-actions";
