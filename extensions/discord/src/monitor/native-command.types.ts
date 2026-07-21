// Discord type declarations define plugin contracts.
import type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
import type { CommandArgValues } from "grokbot/plugin-sdk/native-command-registry";

export type DiscordConfig = NonNullable<OpenClawConfig["channels"]>["discord"];

export type DiscordCommandArgs = {
  raw?: string;
  values?: CommandArgValues;
};
