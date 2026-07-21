/**
 * Streaming JSON parser for Grok CLI output.
 *
 * Grok CLI emits NDJSON (newline-delimited JSON) on stdout when run with
 * --output-format streaming-json. Each line is a JSON object with a `type` field.
 *
 * Supported event types:
 *   { "type": "text",     "text": "..." }            — incremental text delta
 *   { "type": "thought",  "text": "..." }            — thinking/reasoning delta
 *   { "type": "tool_use", "id": "...", "name": "..." }         — tool call started
 *   { "type": "tool_result", "id": "..." }          — tool call completed
 *   { "type": "end",      "sessionId": "..." }      — run finished
 *   { "type": "error",    "message": "..." }         — error occurred
 *   { "type": "usage",    "tokens_in": N, "tokens_out": N } — usage stats
 *
 * The parser is an async generator — it yields events as they are parsed from
 * the buffer. It handles partial JSON lines gracefully (JSON can span multiple
 * data chunks from the child process).
 */

export type GrokCliEvent =
  | GrokCliTextDelta
  | GrokCliThoughtDelta
  | GrokCliToolUseStart
  | GrokCliToolResult
  | GrokCliEndEvent
  | GrokCliErrorEvent
  | GrokCliUsageEvent;

export type GrokCliTextDelta = {
  type: "text";
  text: string;
};

export type GrokCliThoughtDelta = {
  type: "thought";
  text: string;
};

export type GrokCliToolUseStart = {
  type: "tool_use";
  id: string;
  name: string;
  input?: Record<string, unknown>;
};

export type GrokCliToolResult = {
  type: "tool_result";
  id: string;
  name?: string;
  isError?: boolean;
  result?: unknown;
};

export type GrokCliEndEvent = {
  type: "end";
  sessionId?: string;
  usage?: GrokCliUsage;
};

export type GrokCliErrorEvent = {
  type: "error";
  message: string;
};

export type GrokCliUsage = {
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
};

export type GrokCliUsageEvent = {
  type: "usage";
} & GrokCliUsage;

export function createGrokCliStreamingParser(): GrokCliStreamingParser {
  return new GrokCliStreamingParser();
}

class GrokCliStreamingParser {
  private buffer = "";
  private _aborted = false;
  private resolvers: Array<(event: GrokCliEvent) => void> = [];
  private pendingLines: string[] = [];
  private endEmitted = false;

  /** Feed raw text from the child process stdout into the parser. */
  feed(text: string): void {
    if (this._aborted) return;
    this.buffer += text;
    const lines = this.buffer.split("\n");
    // Keep the last potentially incomplete line in the buffer
    this.buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = this.parseLine(line);
      if (event) {
        this.emit(event);
      }
    }
  }

  /** Signal that the stream has ended — flush remaining buffer and emit end. */
  end(): void {
    if (this._aborted) return;
    // Flush any remaining complete line
    if (this.buffer.trim()) {
      const event = this.parseLine(this.buffer);
      if (event) this.emit(event);
      this.buffer = "";
    }
    if (!this.endEmitted) {
      this.endEmitted = true;
      this.emit({ type: "end" });
    }
  }

  /** Abort parsing — used when the child process errors or is killed. */
  abort(): void {
    this._aborted = true;
    this.buffer = "";
    this.endEmitted = true;
  }

  /** Returns an async iterator over parsed events. */
  async *[Symbol.asyncIterator](): AsyncGenerator<GrokCliEvent, void, undefined> {
    const queue: GrokCliEvent[] = [];

    const pushToQueue = (event: GrokCliEvent) => {
      queue.push(event);
    };

    // Register the resolver to collect events into the queue
    this.resolvers.push(pushToQueue);

    try {
      while (true) {
        // Wait for next event
        while (queue.length === 0) {
          if (this._aborted || this.endEmitted) return;
          await sleep(10);
        }
        yield queue.shift()!;
      }
    } finally {
      // Clean up resolver on exit
      this.resolvers = this.resolvers.filter((r) => r !== pushToQueue);
    }
  }

  private parseLine(line: string): GrokCliEvent | null {
    try {
      const parsed = JSON.parse(line);
      if (!parsed || typeof parsed !== "object") return null;

      const event = parsed as Record<string, unknown>;

      // Normalize common fields
      const sessionId =
        typeof event.sessionId === "string"
          ? event.sessionId
          : typeof event.session_id === "string"
            ? event.session_id
            : undefined;

      switch (event.type) {
        case "text":
          return { type: "text", text: typeof event.text === "string" ? event.text : "" };

        case "thought":
          return { type: "thought", text: typeof event.text === "string" ? event.text : "" };

        case "tool_use": {
          const id =
            typeof event.id === "string"
              ? event.id
              : typeof event.toolCallId === "string"
                ? event.toolCallId
                : typeof event.call_id === "string"
                  ? event.call_id
                  : "";
          return {
            type: "tool_use",
            id,
            name: typeof event.name === "string" ? event.name : typeof event.tool === "string" ? event.tool : "unknown",
            input: typeof event.input === "object" && event.input !== null ? (event.input as Record<string, unknown>) : undefined,
          };
        }

        case "tool_result": {
          const id =
            typeof event.id === "string"
              ? event.id
              : typeof event.toolCallId === "string"
                ? event.toolCallId
                : typeof event.call_id === "string"
                  ? event.call_id
                  : "";
          return {
            type: "tool_result",
            id,
            name: typeof event.name === "string" ? event.name : undefined,
            isError: event.isError === true || event.error === true,
            result: event.result ?? event.output ?? event.content ?? event.error,
          };
        }

        case "end":
          return {
            type: "end",
            sessionId,
            usage: parseUsage(event.usage),
          };

        case "error":
          return {
            type: "error",
            message: typeof event.message === "string" ? event.message : String(event.message ?? "Unknown error"),
          };

        case "usage":
          return { type: "usage", ...parseUsage(event) };

        // Grok may emit other event types — ignore them
        default:
          return null;
      }
    } catch {
      // Not valid JSON — treat as raw text
      if (line.trim()) {
        return { type: "text", text: line + "\n" };
      }
      return null;
    }
  }

  private emit(event: GrokCliEvent): void {
    for (const resolve of this.resolvers) {
      try {
        resolve(event);
      } catch {
        // Ignore resolver errors
      }
    }
  }
}

function parseUsage(raw: unknown): GrokCliUsage | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const u = raw as Record<string, unknown>;
  return {
    tokens_in:
      typeof u.tokens_in === "number"
        ? u.tokens_in
        : typeof u.input_tokens === "number"
          ? u.input_tokens
          : undefined,
    tokens_out:
      typeof u.tokens_out === "number"
        ? u.tokens_out
        : typeof u.output_tokens === "number"
          ? u.output_tokens
          : undefined,
    cost_usd: typeof u.cost_usd === "number" ? u.cost_usd : undefined,
  };
}

/** Classifies a Grok CLI result into embedded harness result categories. */
export function classifyGrokCliResult(
  text: string,
  toolMetas: Array<{ toolName: string; meta?: string }>,
  error?: string,
): "empty" | "reasoning-only" | "planning-only" | undefined {
  if (error) return undefined;
  if (!text.trim() && toolMetas.length === 0) return "empty";

  const hasToolCalls = toolMetas.length > 0;
  const hasPlanning = /\b(step|plan|stub|architecture|structure)\b/i.test(text);

  if (!hasToolCalls && hasPlanning) return "planning-only";
  if (!hasToolCalls && text.trim().length > 0) return "reasoning-only";
  return undefined;
}
