// Real workspace contract for memory engine foundation concerns.

export {
  resolveAgentContextLimits,
  resolveAgentDir,
  resolveAgentWorkspaceDir,
  resolveDefaultAgentId,
  resolveSessionAgentId,
} from "./host/grokbot-runtime-agent.js";
export {
  resolveMemorySearchConfig,
  resolveMemorySearchSyncConfig,
  type ResolvedMemorySearchConfig,
  type ResolvedMemorySearchSyncConfig,
} from "./host/grokbot-runtime-agent.js";
export { parseDurationMs } from "./host/grokbot-runtime-config.js";
export { loadConfig } from "./host/grokbot-runtime-config.js";
export { resolveStateDir } from "./host/grokbot-runtime-config.js";
export { resolveSessionTranscriptsDirForAgent } from "./host/grokbot-runtime-config.js";
export {
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
} from "./host/grokbot-runtime-config.js";
export { root } from "./host/grokbot-runtime-io.js";
export { isPathInside } from "./host/fs-utils.js";
export { createSubsystemLogger } from "./host/grokbot-runtime-io.js";
export { detectMime } from "./host/grokbot-runtime-io.js";
export { resolveGlobalSingleton } from "./host/grokbot-runtime-io.js";
export { onSessionTranscriptUpdate } from "./host/grokbot-runtime-session.js";
export { splitShellArgs } from "./host/grokbot-runtime-io.js";
export { runTasksWithConcurrency } from "./host/grokbot-runtime-io.js";
export {
  shortenHomeInString,
  shortenHomePath,
  resolveUserPath,
  truncateUtf16Safe,
} from "./host/grokbot-runtime-io.js";
export type { OpenClawConfig } from "./host/grokbot-runtime-config.js";
export type { SessionSendPolicyConfig } from "./host/grokbot-runtime-config.js";
export type { SecretInput } from "./host/grokbot-runtime-config.js";
export type {
  MemoryBackend,
  MemoryCitationsMode,
  MemoryQmdConfig,
  MemoryQmdIndexPath,
  MemoryQmdMcporterConfig,
  MemoryQmdSearchMode,
} from "./host/grokbot-runtime-config.js";
export type { MemorySearchConfig } from "./host/grokbot-runtime-config.js";
