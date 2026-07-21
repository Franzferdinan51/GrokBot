// Diagnostics Otel API module exposes the plugin public contract.
export {
  createChildDiagnosticTraceContext,
  createDiagnosticTraceContext,
  emitDiagnosticEvent,
  formatDiagnosticTraceparent,
  isValidDiagnosticSpanId,
  isValidDiagnosticTraceFlags,
  isValidDiagnosticTraceId,
  onDiagnosticEvent,
  parseDiagnosticTraceparent,
  type DiagnosticEventMetadata,
  type DiagnosticEventPayload,
  type DiagnosticEventPrivateData,
  type DiagnosticTraceContext,
} from "grokbot/plugin-sdk/diagnostic-runtime";
export { emptyPluginConfigSchema, type OpenClawPluginApi } from "grokbot/plugin-sdk/plugin-entry";
export type {
  OpenClawPluginService,
  OpenClawPluginServiceContext,
} from "grokbot/plugin-sdk/plugin-entry";
export { redactSensitiveText } from "grokbot/plugin-sdk/security-runtime";
