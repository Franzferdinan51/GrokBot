/**
 * Static identity for names that select core agent factory families before assembly.
 */

export type CoreToolFactoryFamily = "base-coding" | "shell" | "grokbot";

type CoreToolFactoryDescriptor = {
  name: string;
  family: CoreToolFactoryFamily;
};

const CORE_TOOL_FACTORY_DESCRIPTORS = [
  { name: "edit", family: "base-coding" },
  { name: "read", family: "base-coding" },
  { name: "write", family: "base-coding" },
  { name: "apply_patch", family: "shell" },
  { name: "exec", family: "shell" },
  { name: "process", family: "shell" },
  { name: "agents_list", family: "grokbot" },
  // Static factory identity only; runtime and tools.catalog apply the Swarm config gate.
  { name: "agents_wait", family: "grokbot" },
  { name: "ask_user", family: "grokbot" },
  { name: "grokbot", family: "grokbot" },
  { name: "computer", family: "grokbot" },
  { name: "conversations_list", family: "grokbot" },
  { name: "conversations_send", family: "grokbot" },
  { name: "conversations_turn", family: "grokbot" },
  { name: "cron", family: "grokbot" },
  { name: "dashboard", family: "grokbot" },
  { name: "gateway", family: "grokbot" },
  { name: "get_goal", family: "grokbot" },
  { name: "heartbeat_respond", family: "grokbot" },
  { name: "image", family: "grokbot" },
  { name: "image_generate", family: "grokbot" },
  { name: "message", family: "grokbot" },
  { name: "music_generate", family: "grokbot" },
  { name: "nodes", family: "grokbot" },
  { name: "pdf", family: "grokbot" },
  { name: "session_status", family: "grokbot" },
  { name: "show_widget", family: "grokbot" },
  { name: "sessions", family: "grokbot" },
  { name: "sessions_history", family: "grokbot" },
  { name: "sessions_list", family: "grokbot" },
  { name: "sessions_search", family: "grokbot" },
  { name: "sessions_send", family: "grokbot" },
  { name: "sessions_spawn", family: "grokbot" },
  { name: "sessions_yield", family: "grokbot" },
  { name: "structured_output", family: "grokbot" },
  { name: "skill_workshop", family: "grokbot" },
  { name: "spawn_task", family: "grokbot" },
  { name: "create_goal", family: "grokbot" },
  { name: "subagents", family: "grokbot" },
  { name: "terminal", family: "grokbot" },
  { name: "transcripts", family: "grokbot" },
  { name: "tts", family: "grokbot" },
  { name: "update_goal", family: "grokbot" },
  { name: "update_plan", family: "grokbot" },
  { name: "dismiss_task", family: "grokbot" },
  { name: "video_generate", family: "grokbot" },
  { name: "web_fetch", family: "grokbot" },
  { name: "web_search", family: "grokbot" },
] as const satisfies readonly CoreToolFactoryDescriptor[];

const CORE_TOOL_FACTORY_FAMILY_BY_NAME = new Map<string, CoreToolFactoryFamily>(
  CORE_TOOL_FACTORY_DESCRIPTORS.map(({ name, family }) => [name, family]),
);

export type OpenClawCodingToolConstructionPlan = {
  includeBaseCodingTools: boolean;
  includeShellTools: boolean;
  includeChannelTools: boolean;
  includeOpenClawTools: boolean;
  includePluginTools: boolean;
};

export function resolveCoreToolFactoryFamily(name: string): CoreToolFactoryFamily | undefined {
  return CORE_TOOL_FACTORY_FAMILY_BY_NAME.get(name);
}
