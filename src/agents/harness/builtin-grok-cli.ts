/**
 * Built-in Grok Build CLI harness for GrokBot.
 *
 * Wires `grok agent stdio` (ACP = Agent Client Protocol) into the GrokBot
 * AgentHarness contract so Grok Build sessions can be selected, forked, and
 * managed through the same session lifecycle as the embedded GrokBot runtime.
 *
 * ACP is Grok Build's proper JSON-RPC 2.0 integration protocol for IDE/editor
 * plugins and headless automation. It provides:
 *   - Proper initialize/authenticate/session lifecycle
 *   - Streaming session/update notifications (assistant_message_chunk, tool_use, etc.)
 *   - Session persistence (session/new + session/prompt)
 *   - xAI OAuth + API key authentication
 *
 * Protocol flow:
 *   1. Spawn `grok agent stdio` (stdio: [null, pipe, pipe])
 *   2. Send initialize { protocolVersion: 1, clientCapabilities: {...} }
 *   3. Send authenticate { methodId: "xai.api_key" | "cached_token" }
 *   4. Send session/new { cwd, mcpServers: [] }
 *   5. Send session/prompt { sessionId, prompt: [{type:"text", text}] }
 *   6. Read session/update notifications from stdout (streaming)
 *   7. On completion, send session/end { sessionId }
 *
 * Docs: https://docs.x.ai/build/cli/headless-scripting
 */

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { resolveGrokCliPath, grokCliAvailableSync } from "./grok-cli-resolver.js";
import { resolveOpenClawPackageRootSync } from "../../infra/grokbot-root.js";
import type { AgentHarness } from "./types.js";
import type {
  EmbeddedRunAttemptParams,
  EmbeddedRunAttemptResult,
} from "../embedded-agent-runner/run/types.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";

const log = createSubsystemLogger("agents/harness/grok-cli");

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

// ---------------------------------------------------------------------------
// ACP JSON-RPC types
// ---------------------------------------------------------------------------

interface AcpNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

interface AcpResponse {
  jsonrpc: "2.0";
  id: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string; data?: unknown };
}

// ---------------------------------------------------------------------------
// MCP server config — passed to session/new
// ---------------------------------------------------------------------------

/** ACP McpServer entry for session/new. */
interface McpServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/** Resolve the grokbot-tools MCP stdio server for built-in CLI harness sessions. */
function resolveBuiltinGrokCliMcpServers(): McpServer[] {
  const packageRoot = resolveOpenClawPackageRootSync({
    argv1: process.argv[1],
    moduleUrl: import.meta.url,
    cwd: process.cwd(),
  });
  if (!packageRoot) return [];

  const distEntry = path.join(packageRoot, "dist", "mcp", "grokbot-tools-serve.js");
  if (fs.existsSync(distEntry)) {
    return [{ name: "grokbot", command: process.execPath, args: [distEntry] }];
  }

  const sourceEntry = path.join(packageRoot, "src", "mcp", "grokbot-tools-serve.ts");
  if (!fs.existsSync(sourceEntry)) return [];

  if (process.versions.bun) {
    return [{ name: "grokbot", command: process.execPath, args: [sourceEntry] }];
  }

  const tsx = (() => {
    try {
      return createRequire(import.meta.url).resolve("tsx");
    } catch {
      return "tsx";
    }
  })();

  return [
    {
      name: "grokbot",
      command: process.execPath,
      args: ["--import", tsx, sourceEntry],
    },
  ];
}

// ---------------------------------------------------------------------------
// ACP client — thin JSON-RPC 2.0 wrapper over grok agent stdio
// ---------------------------------------------------------------------------

class GrokAgentAcpClient {
  private proc: ReturnType<typeof spawn>;
  private rl: ReturnType<typeof createInterface>;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private nextId = 1;
  private settled = false;
  private stderr = "";

  // Streaming callbacks
  onSessionUpdate?: (update: Record<string, unknown>) => void;
  onError?: (err: string) => void;

  constructor(grokPath: string, cwd: string) {
    this.proc = spawn(grokPath, ["agent", "stdio"], {
      // stdin: no keyboard input needed
      // stdout: JSON-RPC responses + notifications
      // stderr: raw grok output (logs, spinner)
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
      cwd,
    });

    this.rl = createInterface({ input: this.proc.stdout! });

    this.proc.stderr?.on("data", (chunk: Buffer) => {
      this.stderr += chunk.toString();
    });

    this.rl.on("line", (line: string) => {
      try {
        const msg = JSON.parse(line) as AcpResponse | AcpNotification;
        if (msg.method?.startsWith("session/update")) {
          this.onSessionUpdate?.((msg as AcpNotification).params?.update as Record<string, unknown>);
        } else if ((msg as AcpResponse).id !== undefined) {
          const resp = msg as AcpResponse;
          const entry = this.pending.get(resp.id);
          if (entry) {
            clearTimeout(entry.timer);
            this.pending.delete(resp.id);
            if (resp.error) {
              entry.reject(new Error(`${resp.error.message}${resp.error.data ? `: ${JSON.stringify(resp.error.data)}` : ""}`));
            } else {
              entry.resolve(resp.result ?? {});
            }
          }
        }
      } catch {
        // Ignore non-JSON lines (e.g. raw text from stderr leak)
      }
    });

    this.proc.on("error", (err) => {
      this.onError?.(`Grok CLI process error: ${err.message}`);
    });
  }

  private send(method: string, params: Record<string, unknown> = {}, timeoutMs = 30000): Promise<Record<string, unknown>> {
    if (this.settled) return Promise.reject(new Error("Client already closed"));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
      try {
        this.proc.stdin?.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      } catch (e) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(e);
      }
    });
  }

  /** Initialize the ACP protocol */
  async initialize(protocolVersion = 1): Promise<Record<string, unknown>> {
    return this.send("initialize", {
      protocolVersion,
      clientCapabilities: {
        fs: { readTextFile: true, writeTextFile: true },
        terminal: true,
      },
    }) as Promise<Record<string, unknown>>;
  }

  /** Authenticate — use XAI_API_KEY env var or cached token */
  async authenticate(authMethods: string[]): Promise<void> {
    const apiKey = process.env.XAI_API_KEY;
    const methodId =
      apiKey && authMethods.includes("xai.api_key")
        ? "xai.api_key"
        : authMethods.includes("cached_token")
          ? "cached_token"
          : null;

    if (!methodId) {
      throw new Error("No valid auth method available. Run `grok login` or set XAI_API_KEY.");
    }

    await this.send("authenticate", { methodId, _meta: { headless: true } });
  }

  /** Create a new headless session */
  async sessionNew(cwd: string, modelId?: string, mcpServers?: McpServer[]): Promise<string> {
    const params: Record<string, unknown> = { cwd, mcpServers: mcpServers ?? [] };
    if (modelId) params.model = modelId;
    const result = await this.send("session/new", params) as { sessionId: string };
    return result.sessionId;
  }

  /** Send a prompt and wait for completion */
  async sessionPrompt(sessionId: string, prompt: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Record<string, unknown>> {
    return this.send("session/prompt", {
      sessionId,
      prompt: [{ type: "text", text: prompt }],
      // Request thinking / reasoning effort if available
      reasoningEffort: "high",
    }, timeoutMs) as Promise<Record<string, unknown>>;
  }

  /** End a session cleanly */
  async sessionEnd(sessionId: string): Promise<void> {
    try {
      await this.send("session/end", { sessionId }, 5000);
    } catch {
      // best-effort
    }
  }

  /** Kill the grok process */
  kill(): void {
    this.settled = true;
    this.pending.forEach(({ timer }) => clearTimeout(timer));
    this.pending.clear();
    try {
      this.proc.kill("SIGTERM");
    } catch {
      // ignore
    }
    this.rl.close();
  }

  getStderr(): string {
    return this.stderr;
  }
}

// ---------------------------------------------------------------------------
// Event classifier — maps ACP session/update fields to GrokBot tool surface
// ---------------------------------------------------------------------------

interface ClassifiedUpdate {
  textDelta?: string;
  toolUse?: { name: string; input: unknown };
  toolResult?: { name: string; result: unknown; isError: boolean };
  done?: boolean;
  stopReason?: string;
}

function classifyAcpUpdate(update: Record<string, unknown>): ClassifiedUpdate {
  const result: ClassifiedUpdate = {};

  // Grok ACP session/update structure:
  // { sessionUpdate: "agent_message_chunk", content: { text: "..." } }
  const sessionUpdate = update.sessionUpdate as string;
  const content = update.content as Record<string, unknown> | undefined;

  if (sessionUpdate === "agent_message_chunk" && content?.text) {
    result.textDelta = String(content.text);
  } else if (sessionUpdate === "tool_use" && content) {
    result.toolUse = {
      name: String(content.name ?? "unknown_tool"),
      input: content.input ?? {},
    };
  } else if (sessionUpdate === "tool_result" && content) {
    result.toolResult = {
      name: String(content.name ?? "unknown_tool"),
      result: content.result,
      isError: Boolean(content.isError ?? (content.result instanceof Error)),
    };
  } else if (sessionUpdate === "end" || sessionUpdate === "done") {
    result.done = true;
    result.stopReason = String(content?.stopReason ?? update.stopReason ?? "end");
  }

  return result;
}

// ---------------------------------------------------------------------------
// Harness factory
// ---------------------------------------------------------------------------

export function createGrokCliAgentHarness(): AgentHarness {
  return {
    id: "grok-cli",
    label: "Grok Build CLI (ACP)",

    supports: () => {
      const available = grokCliAvailableSync();
      if (!available) {
        return {
          supported: false,
          reason: "Grok Build CLI is not installed or not in PATH. Install: curl -fsSL https://x.ai/cli/install.sh | bash",
        };
      }
      // ACP mode takes priority over the embedded harness when xAI API key is available
      return { supported: true, priority: 30 };
    },

    runAttempt: runGrokCliAttempt,

    async reset(_params) {
      // Grok CLI manages its own session state
      log.debug("Grok CLI harness reset called — no-op (CLI manages sessions)");
    },

    async dispose() {
      // No persistent state to clean up
    },
  };
}

// ---------------------------------------------------------------------------
// Attempt runner
// ---------------------------------------------------------------------------

async function runGrokCliAttempt(
  params: EmbeddedRunAttemptParams,
): Promise<EmbeddedRunAttemptResult> {
  const startTime = Date.now();
  const { prompt, sessionId: _sessionId, timeoutMs = DEFAULT_TIMEOUT_MS, abortSignal, cwd = process.cwd() } = params;

  const abortController = new AbortController();
  if (abortSignal) {
    abortSignal.addEventListener("abort", () => abortController.abort());
  }

  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

  let client: GrokAgentAcpClient | null = null;
  let grokSessionId: string | undefined;
  const assistantTexts: string[] = [];
  let currentText = "";
  const toolMetas: EmbeddedRunAttemptResult["toolMetas"] = [];
  let lastToolError: EmbeddedRunAttemptResult["lastToolError"];
  let stopReason: string | undefined;
  let toolUseInProgress: string | undefined;

  try {
    const grokPath = await resolveGrokCliPath();
    log.info(`Starting Grok CLI ACP attempt in ${cwd}`);

    client = new GrokAgentAcpClient(grokPath, cwd);

    // Wire streaming updates
    client.onSessionUpdate = (update) => {
      const classified = classifyAcpUpdate(update);

      if (classified.textDelta) {
        currentText += classified.textDelta;
        if (currentText.length > 100_000) {
          assistantTexts.push(currentText);
          currentText = "";
        }
      }

      if (classified.toolUse) {
        toolUseInProgress = classified.toolUse.name;
        toolMetas.push({
          toolName: classified.toolUse.name,
          meta: `grok-cli:start`,
        });
      }

      if (classified.toolResult) {
        const { name, result, isError } = classified.toolResult;
        const pending = toolMetas.find(
          (m) => m.toolName === name && !m.meta?.includes("result"),
        );
        const resultStr = String(result ?? "");
        if (pending) {
          pending.meta = isError ? `error:${resultStr.slice(0, 200)}` : `ok:${resultStr.slice(0, 200)}`;
        }
        if (isError) {
          lastToolError = {
            toolName: name,
            summary: resultStr.slice(0, 200),
            isError: true,
          };
        }
      }

      if (classified.done) {
        stopReason = classified.stopReason;
      }
    };

    client.onError = (err) => {
      log.error("Grok CLI stderr error", { message: err });
    };

    // 1. Initialize — capture authMethods from the response
    const initResult = (await client.initialize(1)) as { authMethods?: string[] };
    const authMethods = initResult?.authMethods ?? [];

    // 2. Authenticate
    await client.authenticate(authMethods.length ? authMethods : ["cached_token", "xai.api_key"]);

    // 3. Create session
    const modelId = params.modelId
      ? (params.modelId.includes("/") ? params.modelId.split("/")[1] : params.modelId)
      : undefined;
    const mcpServers = resolveBuiltinGrokCliMcpServers();
    grokSessionId = await client.sessionNew(cwd, modelId, mcpServers);

    // 4. Send prompt
    await client.sessionPrompt(grokSessionId, prompt, timeoutMs);

    // 5. End session
    await client.sessionEnd(grokSessionId);

    // Flush remaining text
    if (currentText) {
      assistantTexts.push(currentText);
    }

    const durationMs = Date.now() - startTime;
    log.info(`Grok CLI ACP attempt completed`, {
      grokSessionId,
      durationMs,
      textChars: assistantTexts.join("").length,
      toolCalls: toolMetas.length,
      stopReason,
    });

    return buildAttemptResult({
      aborted: abortController.signal.aborted,
      grokSessionId,
      assistantTexts,
      toolMetas,
      lastToolError,
      durationMs,
      stopReason,
      error: null,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log.error("Grok CLI ACP attempt failed", { error: errorMessage });

    return buildAttemptResult({
      aborted: abortController.signal.aborted,
      grokSessionId,
      assistantTexts,
      toolMetas,
      lastToolError,
      durationMs: Date.now() - startTime,
      stopReason,
      error: errorMessage,
    });
  } finally {
    clearTimeout(timeoutHandle);
    client?.kill();
  }
}

// ---------------------------------------------------------------------------
// Result builder
// ---------------------------------------------------------------------------

function buildAttemptResult({
  aborted,
  grokSessionId,
  assistantTexts,
  toolMetas,
  lastToolError,
  durationMs,
  stopReason,
  error,
}: {
  aborted: boolean;
  grokSessionId?: string;
  assistantTexts: string[];
  toolMetas: EmbeddedRunAttemptResult["toolMetas"];
  lastToolError?: EmbeddedRunAttemptResult["lastToolError"];
  durationMs: number;
  stopReason?: string;
  error: unknown;
}): EmbeddedRunAttemptResult {
  const finalText = assistantTexts.join("");

  let classification: EmbeddedRunAttemptResult["agentHarnessResultClassification"] = undefined;
  if (error) classification = "empty";
  else if (!finalText && toolMetas.length > 0) classification = "reasoning-only";
  else if (finalText && toolMetas.length === 0) classification = undefined; // normal

  return {
    aborted,
    externalAbort: false,
    timedOut: false,
    idleTimedOut: false,
    timedOutDuringCompaction: false,
    promptError: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    promptErrorSource: error ? "prompt" : null,
    sessionIdUsed: grokSessionId ?? "grok-cli",
    messagesSnapshot: [],
    assistantTexts,
    latestMcpAppChannelView: undefined,
    toolMetas,
    lastToolError,
    didSendViaMessagingTool: false,
    didDeliverSourceReplyViaMessageTool: false,
    messagingToolSentTexts: [],
    messagingToolSentMediaUrls: [],
    messagingToolSentTargets: [],
    messagingToolSourceReplyPayloads: undefined,
    heartbeatToolResponse: undefined,
    toolMediaUrls: [],
    hostOwnedToolMediaUrls: undefined,
    toolAudioAsVoice: false,
    toolTrustedLocalMedia: false,
    hasToolMediaBlockReply: false,
    cloudCodeAssistFormatError: false,
    agentHarnessResultClassification: classification,
    bootstrapPromptWarningSignaturesSeen: undefined,
    bootstrapPromptWarningSignature: undefined,
    systemPromptReport: undefined,
    finalPromptText: undefined,
    attemptUsage: undefined,
    promptCache: undefined,
    acceptedSessionSpawns: undefined,
    providerStarted: false,
    timeoutPhase: undefined,
    preflightRecovery: undefined,
    replayInvalid: undefined,
    livenessState: undefined,
  };
}
