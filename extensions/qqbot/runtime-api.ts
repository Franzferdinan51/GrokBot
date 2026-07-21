// Qqbot API module exposes the plugin public contract.
export type { ChannelPlugin, OpenClawPluginApi, PluginRuntime } from "grokbot/plugin-sdk/core";
export type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
export type {
  OpenClawPluginService,
  OpenClawPluginServiceContext,
  PluginLogger,
} from "grokbot/plugin-sdk/core";
export type { ResolvedQQBotAccount, QQBotAccountConfig } from "./src/types.js";
export { getQQBotRuntime, setQQBotRuntime } from "./src/bridge/runtime.js";
