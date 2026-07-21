// Whatsapp plugin module implements channel actions behavior.
import { createActionGate } from "grokbot/plugin-sdk/channel-actions";
import type { ChannelMessageActionName } from "grokbot/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";

export { listWhatsAppAccountIds, resolveWhatsAppAccount } from "./accounts.js";
export { resolveWhatsAppReactionLevel } from "./reaction-level.js";
export { createActionGate, type ChannelMessageActionName, type OpenClawConfig };
