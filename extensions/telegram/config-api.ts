// Telegram API module exposes the plugin public contract.
export { buildChannelConfigSchema } from "grokbot/plugin-sdk/channel-config-schema";
export { TelegramConfigSchema } from "grokbot/plugin-sdk/bundled-channel-config-schema";
export {
  normalizeTelegramCommandDescription,
  normalizeTelegramCommandName,
  resolveTelegramCustomCommands,
} from "./src/command-config.js";
