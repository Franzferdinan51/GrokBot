// Discord API module exposes the plugin public contract.
export {
  buildComputedAccountStatusSnapshot,
  buildTokenChannelStatusSummary,
  PAIRING_APPROVED_MESSAGE,
  projectCredentialSnapshotFields,
  resolveConfiguredFromCredentialStatuses,
} from "grokbot/plugin-sdk/channel-status";
export { buildChannelConfigSchema, DiscordConfigSchema } from "../config-api.js";
export type {
  ChannelMessageActionAdapter,
  ChannelMessageActionContext,
  ChannelMessageActionName,
} from "grokbot/plugin-sdk/channel-contract";
export type {
  ChannelPlugin,
  OpenClawPluginApi,
  PluginRuntime,
} from "grokbot/plugin-sdk/channel-plugin-common";
export type {
  DiscordAccountConfig,
  DiscordActionConfig,
  DiscordConfig,
  OpenClawConfig,
} from "grokbot/plugin-sdk/config-contracts";
export {
  jsonResult,
  readNonNegativeIntegerParam,
  readNumberParam,
  readPositiveIntegerParam,
  readStringArrayParam,
  readStringParam,
  resolvePollMaxSelections,
} from "grokbot/plugin-sdk/channel-actions";
export type { ActionGate } from "grokbot/plugin-sdk/channel-actions";
export { readBooleanParam } from "grokbot/plugin-sdk/boolean-param";
export {
  assertMediaNotDataUrl,
  parseAvailableTags,
  readReactionParams,
  withNormalizedTimestamp,
} from "grokbot/plugin-sdk/channel-actions";
export {
  createHybridChannelConfigAdapter,
  createScopedChannelConfigAdapter,
  createScopedAccountConfigAccessors,
  createScopedChannelConfigBase,
  createTopLevelChannelConfigAdapter,
} from "grokbot/plugin-sdk/channel-config-helpers";
export {
  createAccountActionGate,
  createAccountListHelpers,
} from "grokbot/plugin-sdk/account-helpers";
export { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "grokbot/plugin-sdk/account-id";
export {
  emptyPluginConfigSchema,
  formatPairingApproveHint,
} from "grokbot/plugin-sdk/channel-plugin-common";
export { loadOutboundMediaFromUrl } from "grokbot/plugin-sdk/outbound-media";
export { resolveAccountEntry } from "grokbot/plugin-sdk/routing";
export {
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
  normalizeSecretInputString,
} from "grokbot/plugin-sdk/secret-input";
export { getChatChannelMeta } from "./channel-api.js";
export { resolveDiscordOutboundSessionRoute } from "./outbound-session-route.js";
