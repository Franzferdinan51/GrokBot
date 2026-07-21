/**
 * Public runtime API barrel for ACPX. Core and plugin consumers import these
 * SDK-facing ACP runtime contracts instead of reaching into ACPX internals.
 */
export type { AcpRuntimeErrorCode } from "grokbot/plugin-sdk/acp-runtime-backend";
export {
  AcpRuntimeError,
  getAcpRuntimeBackend,
  tryDispatchAcpReplyHook,
  registerAcpRuntimeBackend,
  unregisterAcpRuntimeBackend,
} from "grokbot/plugin-sdk/acp-runtime-backend";
export type {
  AcpRuntime,
  AcpRuntimeCapabilities,
  AcpRuntimeDoctorReport,
  AcpRuntimeEnsureInput,
  AcpRuntimeEvent,
  AcpRuntimeHandle,
  AcpRuntimeStatus,
  AcpRuntimeTurn,
  AcpRuntimeTurnAttachment,
  AcpRuntimeTurnInput,
  AcpRuntimeTurnResult,
  AcpRuntimeTurnResultError,
  AcpSessionUpdateTag,
} from "grokbot/plugin-sdk/acp-runtime-backend";
export type {
  OpenClawPluginApi,
  OpenClawPluginConfigSchema,
  OpenClawPluginService,
  OpenClawPluginServiceContext,
  PluginLogger,
} from "grokbot/plugin-sdk/core";
export type {
  PluginHookReplyDispatchContext,
  PluginHookReplyDispatchEvent,
  PluginHookReplyDispatchResult,
} from "grokbot/plugin-sdk/core";
export type {
  WindowsSpawnProgram,
  WindowsSpawnProgramCandidate,
  WindowsSpawnResolution,
} from "grokbot/plugin-sdk/windows-spawn";
export {
  applyWindowsSpawnProgramPolicy,
  materializeWindowsSpawnProgram,
  resolveWindowsSpawnProgramCandidate,
} from "grokbot/plugin-sdk/windows-spawn";
export {
  listKnownProviderAuthEnvVarNames,
  omitEnvKeysCaseInsensitive,
} from "grokbot/plugin-sdk/provider-env-vars";
