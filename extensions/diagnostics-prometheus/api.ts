// Diagnostics Prometheus API module exposes the plugin public contract.
export type {
  DiagnosticEventMetadata,
  DiagnosticEventPayload,
} from "grokbot/plugin-sdk/diagnostic-runtime";
export { isInternalDiagnosticEventMetadata } from "grokbot/plugin-sdk/diagnostic-runtime";
export {
  emptyPluginConfigSchema,
  type OpenClawPluginApi,
  type OpenClawPluginHttpRouteHandler,
  type OpenClawPluginService,
  type OpenClawPluginServiceContext,
} from "grokbot/plugin-sdk/plugin-entry";
export { redactSensitiveText } from "grokbot/plugin-sdk/security-runtime";
