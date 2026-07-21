// Imessage plugin module implements account types behavior.
import type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";

export type IMessageAccountConfig = Omit<
  NonNullable<NonNullable<OpenClawConfig["channels"]>["imessage"]>,
  "accounts" | "defaultAccount"
>;
