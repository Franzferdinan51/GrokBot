// Tests that grokbot-tools MCP server is passed to session/new.
import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoist mocks before importing the module under test.
const resolveGrokCliPath = vi.hoisted(() => vi.fn());
const resolveOpenClawPackageRootSync = vi.hoisted(() => vi.fn());
const grokCliAvailableSync = vi.hoisted(() => vi.fn());
const existsSync = vi.hoisted(() => vi.fn());
const mockClientInstance = vi.hoisted(() => ({
  onSessionUpdate: undefined,
  onError: undefined,
  initialize: vi.fn().mockResolvedValue({ authMethods: ["cached_token"] }),
  authenticate: vi.fn().mockResolvedValue(undefined),
  sessionNew: vi.fn().mockResolvedValue("test-session-id"),
  sessionPrompt: vi.fn().mockResolvedValue({}),
  sessionEnd: vi.fn().mockResolvedValue(undefined),
  kill: vi.fn(),
  getStderr: vi.fn().mockReturnValue(""),
}));
const GrokAgentAcpClient = vi.hoisted(
  () => vi.fn(() => mockClientInstance),
);

vi.mock("./grok-cli-resolver.js", () => ({
  resolveGrokCliPath,
  grokCliAvailableSync,
}));

vi.mock("../../infra/grokbot-root.js", () => ({
  resolveOpenClawPackageRootSync,
}));

vi.mock("node:fs", () => ({
  existsSync,
}));

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

vi.mock("./grok-cli-resolver.js", () => ({
  resolveGrokCliPath,
  grokCliAvailableSync,
}));

import { createGrokCliAgentHarness } from "./builtin-grok-cli.js";

describe("createGrokCliAgentHarness", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    grokCliAvailableSync.mockReturnValue(true);
    resolveGrokCliPath.mockResolvedValue("/usr/local/bin/grok");
    resolveOpenClawPackageRootSync.mockReturnValue("/Users/duckets/Desktop/GrokAgent/GrokBot");

    // Dist entry exists → should use it
    existsSync.mockImplementation((p: string) => {
      if (p.endsWith("dist/mcp/grokbot-tools-serve.js")) return true;
      if (p.endsWith("src/mcp/grokbot-tools-serve.ts")) return false;
      return false;
    });
  });

  it("passes grokbot-tools MCP server to session/new via dist entry", async () => {
    const harness = createGrokCliAgentHarness();
    const { runAttempt } = harness;

    const params = {
      prompt: "hello",
      sessionId: "test-session",
      abortSignal: new AbortController().signal,
    } as never;

    await runAttempt(params);

    expect(mockClientInstance.sessionNew).toHaveBeenCalledOnce();
    const callArgs = mockClientInstance.sessionNew.mock.calls[0]!;

    // Third argument should be the resolved mcpServers array
    const mcpServers = callArgs[2] as { name: string; command: string; args: string[] }[];
    expect(mcpServers).toBeInstanceOf(Array);
    expect(mcpServers.length).toBeGreaterThan(0);

    const grokbotServer = mcpServers.find((s) => s.name === "grokbot");
    expect(grokbotServer).toBeDefined();
    expect(grokbotServer!.command).toBe(process.execPath);
    expect(grokbotServer!.args.at(-1)).toMatch(/grokbot-tools-serve\.js$/);
  });

  it("passes grokbot-tools MCP server via source entry when dist is absent", async () => {
    // Dist missing, source present → falls back to source + tsx
    existsSync.mockImplementation((p: string) => {
      if (p.endsWith("dist/mcp/grokbot-tools-serve.js")) return false;
      if (p.endsWith("src/mcp/grokbot-tools-serve.ts")) return true;
      return false;
    });

    const harness = createGrokCliAgentHarness();
    const { runAttempt } = harness;

    const params = {
      prompt: "hello",
      sessionId: "test-session",
      abortSignal: new AbortController().signal,
    } as never;

    await runAttempt(params);

    const callArgs = mockClientInstance.sessionNew.mock.calls[0]!;
    const mcpServers = callArgs[2] as { name: string; command: string; args: string[] }[];

    const grokbotServer = mcpServers.find((s) => s.name === "grokbot");
    expect(grokbotServer).toBeDefined();
    expect(grokbotServer!.command).toBe(process.execPath);
    // Source entry uses --import tsx ...
    expect(grokbotServer!.args).toContain("--import");
    expect(grokbotServer!.args.at(-1)).toMatch(/grokbot-tools-serve\.ts$/);
  });

  it("returns empty mcpServers when package root cannot be resolved", async () => {
    resolveOpenClawPackageRootSync.mockReturnValue(null);

    const harness = createGrokCliAgentHarness();
    const { runAttempt } = harness;

    const params = {
      prompt: "hello",
      sessionId: "test-session",
      abortSignal: new AbortController().signal,
    } as never;

    await runAttempt(params);

    const callArgs = mockClientInstance.sessionNew.mock.calls[0]!;
    expect(callArgs[2]).toEqual([]);
  });
});
