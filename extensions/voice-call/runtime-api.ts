// Private runtime barrel for the bundled Voice Call extension.
// Keep this barrel thin and aligned with the local extension surface.

export { definePluginEntry } from "grokbot/plugin-sdk/plugin-entry";
export type { OpenClawPluginApi } from "grokbot/plugin-sdk/plugin-entry";
export type { GatewayRequestHandlerOptions } from "grokbot/plugin-sdk/gateway-runtime";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "grokbot/plugin-sdk/webhook-request-guards";
export { fetchWithSsrFGuard, isBlockedHostnameOrIp } from "grokbot/plugin-sdk/ssrf-runtime";
export type { SessionEntry } from "grokbot/plugin-sdk/session-store-runtime";
export {
  TtsAutoSchema,
  TtsConfigSchema,
  TtsModeSchema,
  TtsProviderSchema,
} from "grokbot/plugin-sdk/tts-runtime";
export { sleep } from "grokbot/plugin-sdk/runtime-env";
