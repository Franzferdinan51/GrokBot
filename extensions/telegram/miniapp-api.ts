// Telegram Mini App registerFull entrypoint.
import type { OpenClawPluginApi } from "grokbot/plugin-sdk/plugin-entry";
import { registerTelegramMiniAppCommand } from "./src/miniapp/command.js";
import { registerTelegramMiniAppRoutes } from "./src/miniapp/routes.js";

export function registerTelegramMiniApp(api: OpenClawPluginApi): void {
  registerTelegramMiniAppRoutes(api);
  registerTelegramMiniAppCommand(api);
}
