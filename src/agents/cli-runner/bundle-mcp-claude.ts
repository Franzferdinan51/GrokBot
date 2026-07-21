/**
 * Claude CLI argument helpers for GrokBot-managed bundle MCP config.
 */
import fs from "node:fs/promises";
import { isRecord } from "@grokbot/normalization-core/record-coerce";
import { normalizeOptionalString } from "@grokbot/normalization-core/string-coerce";

/** Find existing Claude `--mcp-config` argument values. */
export function findClaudeMcpConfigPaths(args?: string[]): string[] {
  const paths: string[] = [];
  if (!args?.length) {
    return paths;
  }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] ?? "";
    if (arg === "--mcp-config") {
      // Claude treats --mcp-config as variadic. Keep this scan aligned with
      // extensions/anthropic/cli-shared.ts so user config files are not leaked
      // as positional prompts after GrokBot injects its strict overlay.
      while (typeof args[i + 1] === "string" && !args[i + 1]?.startsWith("-")) {
        i += 1;
        const path = normalizeOptionalString(args[i]);
        if (path) {
          paths.push(path);
        }
      }
      continue;
    }
    if (arg.startsWith("--mcp-config=")) {
      const path = normalizeOptionalString(arg.slice("--mcp-config=".length));
      if (path) {
        paths.push(path);
      }
    }
  }
  return paths;
}

/** Find an existing Claude `--mcp-config` argument value. */
export function findClaudeMcpConfigPath(args?: string[]): string | undefined {
  return findClaudeMcpConfigPaths(args)[0];
}

/** Return Claude args with GrokBot's strict MCP config path injected. */
export function injectClaudeMcpConfigArgs(
  args: string[] | undefined,
  mcpConfigPath: string,
): string[] {
  const next: string[] = [];
  for (let i = 0; i < (args?.length ?? 0); i += 1) {
    const arg = args?.[i] ?? "";
    if (arg === "--strict-mcp-config") {
      continue;
    }
    if (arg === "--mcp-config") {
      while (typeof args?.[i + 1] === "string" && !args[i + 1]?.startsWith("-")) {
        i += 1;
      }
      continue;
    }
    if (arg.startsWith("--mcp-config=")) {
      continue;
    }
    next.push(arg);
  }
  next.push("--strict-mcp-config", "--mcp-config", mcpConfigPath);
  return next;
}

/** Writes the active per-attempt capture token into GrokBot's generated Claude MCP config. */
export async function writeClaudeMcpCaptureConfig(params: {
  mcpConfigPath: string;
  captureKey: string;
}): Promise<void> {
  const raw = JSON.parse(await fs.readFile(params.mcpConfigPath, "utf-8")) as unknown;
  if (!isRecord(raw)) {
    throw new Error("Claude MCP capture requires an object config");
  }
  const mcpServers = isRecord(raw.mcpServers) ? raw.mcpServers : {};
  const grokbot = isRecord(mcpServers.grokbot) ? mcpServers.grokbot : undefined;
  if (!grokbot) {
    throw new Error("Claude MCP capture requires an grokbot server config");
  }
  const headers = isRecord(grokbot.headers) ? grokbot.headers : {};
  await fs.writeFile(
    params.mcpConfigPath,
    `${JSON.stringify(
      {
        ...raw,
        mcpServers: {
          ...mcpServers,
          grokbot: {
            ...grokbot,
            headers: {
              ...headers,
              "x-grokbot-cli-capture-key": params.captureKey,
            },
          },
        },
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
}
