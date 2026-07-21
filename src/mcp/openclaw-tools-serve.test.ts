// GrokBot MCP tools tests cover core tool server startup and registration.
import { afterEach, describe, expect, it, vi } from "vitest";
import { hashSystemAgentOperation } from "../agents/tools/system-agent-tool.js";
import {
  buildSystemAgentToolsMcpServerConfig,
  OPENCLAW_TOOLS_MCP_SYSTEM_AGENT_APPROVAL_ARMED_ENV,
  OPENCLAW_TOOLS_MCP_SYSTEM_AGENT_PROPOSAL_ENV,
  OPENCLAW_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV,
  OPENCLAW_TOOLS_MCP_TOOLS_ENV,
  resolveOpenClawToolsMcpSystemAgentSurface,
  resolveOpenClawToolsMcpToolSelection,
} from "./grokbot-tools-serve-config.js";
import {
  OPENCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV,
  resolveOpenClawToolsForMcp,
  resolveOpenClawToolsMcpAgentSessionKey,
} from "./grokbot-tools-serve.js";
import { createPluginToolsMcpHandlers } from "./plugin-tools-handlers.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GrokBot tools MCP server", () => {
  it("exposes cron", async () => {
    const handlers = createPluginToolsMcpHandlers(
      resolveOpenClawToolsForMcp({ agentSessionKey: "agent:worker:main" }),
    );

    const listed = await handlers.listTools();
    expect(listed.tools.map((tool) => tool.name)).toContain("cron");
  });

  it("requires the managed bridge to pass a real agent session key", () => {
    expect(() => resolveOpenClawToolsForMcp({ agentSessionKey: "" })).toThrow(
      OPENCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV,
    );
  });

  it("reads the managed bridge agent session key from env", () => {
    expect(
      resolveOpenClawToolsMcpAgentSessionKey({
        [OPENCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV]: " agent:worker:main ",
      }),
    ).toBe("agent:worker:main");
  });

  it("serves the ring-zero grokbot tool without an agent session key", async () => {
    const handlers = createPluginToolsMcpHandlers(
      resolveOpenClawToolsForMcp({ tools: ["grokbot"], systemAgentSurface: "cli" }),
    );

    const listed = await handlers.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual(["grokbot"]);
  });

  it("returns approved CLI MCP mutations to the host instead of applying them", async () => {
    const operation = { kind: "config-set", path: "gateway.port", value: "19001" } as const;
    vi.stubEnv(OPENCLAW_TOOLS_MCP_SYSTEM_AGENT_APPROVAL_ARMED_ENV, "1");
    vi.stubEnv(OPENCLAW_TOOLS_MCP_SYSTEM_AGENT_PROPOSAL_ENV, hashSystemAgentOperation(operation));
    const handlers = createPluginToolsMcpHandlers(
      resolveOpenClawToolsForMcp({ tools: ["grokbot"], systemAgentSurface: "cli" }),
    );

    const result = await handlers.callTool({
      name: "grokbot",
      arguments: {
        action: "config_set",
        path: "gateway.port",
        value: "19001",
        approved: true,
      },
    });

    expect(JSON.stringify(result)).toContain("directive:approved-operation:");
  });

  it("parses the served tool selection from env and defaults to cron", () => {
    expect(resolveOpenClawToolsMcpToolSelection({})).toEqual(["cron"]);
    expect(
      resolveOpenClawToolsMcpToolSelection({
        [OPENCLAW_TOOLS_MCP_TOOLS_ENV]: " grokbot , cron ",
      }),
    ).toEqual(["grokbot", "cron"]);
    expect(() =>
      resolveOpenClawToolsMcpToolSelection({ [OPENCLAW_TOOLS_MCP_TOOLS_ENV]: "exec" }),
    ).toThrow(OPENCLAW_TOOLS_MCP_TOOLS_ENV);
  });

  it("parses the grokbot surface from env and defaults to cli", () => {
    expect(resolveOpenClawToolsMcpSystemAgentSurface({})).toBe("cli");
    expect(
      resolveOpenClawToolsMcpSystemAgentSurface({
        [OPENCLAW_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV]: "gateway",
      }),
    ).toBe("gateway");
    expect(() =>
      resolveOpenClawToolsMcpSystemAgentSurface({
        [OPENCLAW_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV]: "remote",
      }),
    ).toThrow(OPENCLAW_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV);
  });

  it("builds a grokbot-only stdio server config under the grokbot name", () => {
    const config = buildSystemAgentToolsMcpServerConfig({ surface: "gateway" });

    expect(Object.keys(config.mcpServers)).toEqual(["grokbot"]);
    const server = config.mcpServers.grokbot as {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
    };
    expect(server.command).toBe(process.execPath);
    expect(server.args?.at(-1)).toMatch(/grokbot-tools-serve\.(js|ts)$/);
    expect(server.env).toEqual({
      [OPENCLAW_TOOLS_MCP_TOOLS_ENV]: "grokbot",
      [OPENCLAW_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV]: "gateway",
    });
  });
});
