// Discord plugin module implements native command behavior.
import { resolveDirectStatusReplyForSession } from "grokbot/plugin-sdk/command-status-runtime";
import * as pluginRuntime from "grokbot/plugin-sdk/plugin-runtime";
import { dispatchReplyWithDispatcher } from "grokbot/plugin-sdk/reply-dispatch-runtime";
import { getSessionEntry } from "grokbot/plugin-sdk/session-store-runtime";
import { resolveDiscordNativeInteractionRouteState } from "./native-command-route.js";

export const nativeCommandRuntime = {
  matchPluginCommand: pluginRuntime.matchPluginCommand,
  executePluginCommand: pluginRuntime.executePluginCommand,
  dispatchReplyWithDispatcher,
  resolveDirectStatusReplyForSession,
  resolveDiscordNativeInteractionRouteState,
  getSessionEntry,
};
