/**
 * Built-in Grok CLI harness for GrokBot.
 *
 * Wires Grok Build CLI (grok -p "..." --output-format streaming-json) into the
 * GrokBot AgentHarness contract so Grok CLI sessions can be selected, forked,
 * and managed through the same session lifecycle as the embedded GrokBot runtime.
 *
 * Grok CLI is treated as an external CLI harness — it is discovered via PATH or
 * an explicit GROK_BUILD_PATH env var, spawned as a child process with JSON
 * streaming on stdout, and its tool-call events are normalized to GrokBot's
 * embedded-agent tool surface.
 *
 * Architecture:
 *   GrokBot harness selection
 *     → builtin-grok-cli (this file)
 *       → spawns grok CLI child process
 *         → parses streaming JSON events
 *         → maps to EmbeddedRunAttemptResult
 *
 * Key differences from OpenClaw embedded harness:
 *   - Grok CLI owns its own session model (ACP tree sessions, parentId/rootId)
 *   - Grok CLI has built-in self-modification (skills, rules, systemPrompt override)
 *   - Grok CLI has native mixture-of-agents (MOA) for multi-model consultation
 *   - Grok CLI uses xAI OAuth as primary auth (not API key)
 */

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import {
  createGrokCliStreamingParser,
  classifyGrokCliResult,
  type GrokCliEvent,
  type GrokCliTextDelta,
  type GrokCliToolUseStart,
  type GrokCliToolResult,
  type GrokCliEndEvent,
  type GrokCliErrorEvent,
  type GrokCliUsage,
} from "./grok-cli-parser.js";
import { resolveGrokCliPath, grokCliAvailable } from "./grok-cli-resolver.js";
import type { AgentHarness } from "./types.js";
import type { EmbeddedRunAttemptParams, EmbeddedRunAttemptResult } from "../embedded-agent-runner/run/types.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";

const log = createSubsystemLogger("agents/harness/grok-cli");

// How long a Grok CLI run can run before timing out (default 10 min)
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

export function createGrokCliAgentHarness(): AgentHarness {
  return {
    id: "grok-cli",
    label: "Grok Build CLI agent",
    supports: async (ctx) => {
      // Grok CLI harness supports any provider — it routes through xAI internally
      const available = await grokCliAvailable().catch(() => false);
      if (!available) {
        return {
          supported: false,
          reason: "Grok Build CLI is not installed or not in PATH. Install from https://grok.com/build",
        };
      }
      return { supported: true, priority: 20 };
    },

    runAttempt: runGrokCliAttempt,

    async reset(_params) {
      // Grok CLI manages its own session state; no host-level reset needed
      log.debug("Grok CLI harness reset called (no-op — CLI manages its own sessions)");
    },

    async dispose() {
      log.debug("Grok CLI harness dispose called (no persistent state to clean up)");
    },
  };
}

/**
 * Runs a Grok CLI agent attempt.
 *
 * Maps EmbeddedRunAttemptParams prompt → grok -p "..." CLI args,
 * spawns the child process, parses streaming JSON events, and maps
 * them to EmbeddedRunAttemptResult.
 */
async function runGrokCliAttempt(
  params: EmbeddedRunAttemptParams,
): Promise<EmbeddedRunAttemptResult> {
  const startTime = Date.now();
  const { prompt, sessionId, timeoutMs = DEFAULT_TIMEOUT_MS } = params;

  const abortController = new AbortController();
  const abortSignal = params.abortSignal;
  if (abortSignal) {
    abortSignal.addEventListener("abort", () => abortController.abort());
  }

  // Wire timeout
  const timeoutHandle = setTimeout(() => {
    abortController.abort();
  }, timeoutMs);

  let grokSessionId: string | undefined;
  const assistantTexts: string[] = [];
  let currentText = "";
  const toolMetas: EmbeddedRunAttemptResult["toolMetas"] = [];
  let lastToolError: EmbeddedRunAttemptResult["lastToolError"];
  let didSendViaMessagingTool = false;
  const messagingToolSentTexts: string[] = [];

  try {
    const grokPath = await resolveGrokCliPath();
    const cwd = params.cwd ?? process.cwd();

    log.info(`Starting Grok CLI attempt in ${cwd}`, { sessionId });

    // Build grok CLI args
    // grok -p <prompt> --cwd <cwd> --output-format streaming-json [--model <model>] [--think]
    const cliArgs = buildGrokCliArgs(params, prompt, cwd);

    const child = spawn(grokPath, cliArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        // Pass Grok/xAI auth through env — grok CLI handles OAuth internally
        // GROK_BUILD_PATH can be set to point at a specific grok binary
      },
      signal: abortController.signal,
    });

    let stderr = "";

    // Parse streaming output
    const parser = createGrokCliStreamingParser();

    child.stdout?.on("data", (chunk: Buffer) => {
      parser.feed(chunk.toString());
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      log.error("Grok CLI process error", { error: err.message });
      parser.abort();
    });

    // Process events as they arrive
    for await (const event of parser) {
      switch (event.type) {
        case "text": {
          const delta = event as GrokCliTextDelta;
          currentText += delta.text;
          // Accumulate into assistant text chunks
          if (currentText.length > 100_000) {
            assistantTexts.push(currentText);
            currentText = "";
          }
          break;
        }

        case "tool_use": {
          const toolEvent = event as GrokCliToolUseStart;
          // Grok CLI started executing a tool — record it in toolMetas
          toolMetas.push({
            toolName: toolEvent.name,
            meta: `grok-cli:${toolEvent.type}`,
          });
          break;
        }

        case "tool_result": {
          const resultEvent = event as GrokCliToolResult;
          // Update the matching tool meta with result info
          const pending = toolMetas.find(
            (m) => m.toolName === resultEvent.name && !m.meta?.includes("result"),
          );
          if (pending) {
            pending.meta = resultEvent.isError
              ? `error:${resultEvent.result}`
              : `ok:${String(resultEvent.result).slice(0, 100)}`;
            if (resultEvent.isError) {
              lastToolError = {
                toolName: resultEvent.name,
                summary: String(resultEvent.result).slice(0, 200),
                isError: true,
              };
            }
          }
          break;
        }

        case "end": {
          const endEvent = event as GrokCliEndEvent;
          grokSessionId = endEvent.sessionId ?? grokSessionId;
          break;
        }

        case "error": {
          const errorEvent = event as GrokCliErrorEvent;
          log.error("Grok CLI error event", { message: errorEvent.message });
          break;
        }
      }
    }

    // Wait for process to finish
    await new Promise<void>((resolve, reject) => {
      child.on("exit", (code, signal) => {
        if (code === 0 || signal === "SIGTERM") {
          resolve();
        } else {
          reject(
            new Error(
              `Grok CLI exited with code ${code ?? `signal ${signal}`}${stderr ? `: ${stderr}` : ""}`,
            ),
          );
        }
      });
      child.on("error", reject);
    });

    // Flush any remaining text
    if (currentText) {
      assistantTexts.push(currentText);
    }

    const durationMs = Date.now() - startTime;
    log.info(`Grok CLI attempt completed`, {
      sessionId,
      grokSessionId,
      durationMs,
      textChars: assistantTexts.join("").length,
      toolCalls: toolMetas.length,
    });

    // Map to EmbeddedRunAttemptResult
    return buildAttemptResult({
      params,
      aborted: abortController.signal.aborted,
      grokSessionId,
      assistantTexts,
      toolMetas,
      lastToolError,
      didSendViaMessagingTool,
      messagingToolSentTexts,
      durationMs,
      parser,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const aborted = abortController.signal.aborted;
    log.error("Grok CLI attempt failed", { error: errorMessage, aborted });
    clearTimeout(timeoutHandle);

    return buildAttemptResult({
      params,
      aborted,
      grokSessionId,
      assistantTexts,
      toolMetas,
      lastToolError,
      didSendViaMessagingTool,
      messagingToolSentTexts,
      durationMs: Date.now() - startTime,
      parser: null,
      error: errorMessage,
    });
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function buildGrokCliArgs(
  params: EmbeddedRunAttemptParams,
  prompt: string,
  cwd: string,
): string[] {
  const args: string[] = [
    "-p",
    prompt,
    "--cwd",
    cwd,
    "--output-format",
    "streaming-json",
  ];

  // Pass model if specified
  if (params.modelId) {
    // Strip provider prefix if present (e.g. "xai/grok-3" → "grok-3")
    const model = params.modelId.includes("/")
      ? params.modelId.split("/")[1]
      : params.modelId;
    args.push("--model", model);
  }

  // Pass thinking level as --reasoning-effort
  // Grok uses: none, low, medium, high, ultra
  // OpenClaw uses: none, low, medium, high
  const thinkLevel = params.thinkLevel;
  if (thinkLevel && thinkLevel !== "none") {
    const effort = thinkLevel === "high" ? "high" : thinkLevel;
    args.push("--reasoning-effort", effort);
  }

  // Resume from session if provided
  // (Grok CLI session IDs come from grokSessionId in the result)
  // This would need session persistence logic to be fully implemented

  // Disable web search if not available (or let Grok decide)
  // Pass through MCP tools config if present in params
  // (Grok CLI --tools flag accepts a tools config)

  return args;
}

function buildAttemptResult({
  params,
  aborted,
  grokSessionId,
  assistantTexts,
  toolMetas,
  lastToolError,
  didSendViaMessagingTool,
  messagingToolSentTexts,
  durationMs,
  parser,
  error,
}: {
  params: EmbeddedRunAttemptParams;
  aborted: boolean;
  grokSessionId?: string;
  assistantTexts: string[];
  toolMetas: EmbeddedRunAttemptResult["toolMetas"];
  lastToolError?: EmbeddedRunAttemptResult["lastToolError"];
  didSendViaMessagingTool: boolean;
  messagingToolSentTexts: string[];
  durationMs: number;
  parser: ReturnType<typeof createGrokCliStreamingParser> | null;
  error?: string;
}): EmbeddedRunAttemptResult {
  const finalText = assistantTexts.join("");
  const classification = classifyGrokCliResult(finalText, toolMetas, error);

  return {
    aborted,
    externalAbort: false,
    timedOut: false,
    idleTimedOut: false,
    timedOutDuringCompaction: false,
    promptError: error ? new Error(error) : null,
    promptErrorSource: error ? "prompt" : null,
    sessionIdUsed: grokSessionId ?? params.sessionId ?? "grok-cli-unknown",
    messagesSnapshot: [], // Grok CLI manages its own transcript; host does not maintain a parallel one
    assistantTexts,
    latestMcpAppChannelView: undefined,
    toolMetas,
    lastToolError,
    didSendViaMessagingTool,
    didDeliverSourceReplyViaMessageTool: false,
    messagingToolSentTexts,
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
    // Grok CLI tool calls go through the normal tool surface
    // so they count as harness-classified if they came from Grok
    bootstrapPromptWarningSignaturesSeen: undefined,
    bootstrapPromptWarningSignature: undefined,
    systemPromptReport: undefined,
    finalPromptText: undefined,
    attemptUsage: undefined,
    promptCache: undefined,
    // MCP app channel not used in raw CLI mode
    acceptedSessionSpawns: undefined,
    // Provider-level events not available from raw CLI
    providerStarted: false,
    timeoutPhase: undefined,
    preflightRecovery: undefined,
    replayInvalid: undefined,
    livenessState: undefined,
  };
}
