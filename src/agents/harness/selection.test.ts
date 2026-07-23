// Covers agent harness selection, fallback behavior, and compaction routing.
import type { Model } from "grokbot/plugin-sdk/llm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenClawConfig } from "../../config/config.js";
import { OPENCLAW_EMBEDDED_CONTEXT_ENGINE_HOST } from "../../context-engine/host-compat.js";
import type { ContextEngine } from "../../context-engine/types.js";
import { createOpenClawCodingTools } from "../../plugin-sdk/agent-harness.js";
import { mintSecretSentinel } from "../../secrets/sentinel.js";
import { isHostScopedAgentToolActive } from "../agent-tools.ring-zero-context.js";
import { testing as cliBackendsTesting } from "../cli-backends.test-support.js";
import type {
  EmbeddedRunAttemptParams,
  EmbeddedRunAttemptResult,
} from "../embedded-agent-runner/run/types.js";
import type { SystemAgentToolOptions } from "../tools/system-agent-tool.js";
import { maybeCompactAgentHarnessSession } from "./compaction.js";
import { clearAgentHarnesses, registerAgentHarness } from "./registry.js";
import {
  agentHarnessBuildsOpenClawTools,
  agentHarnessExposesOpenClawTools,
  resolveAgentHarnessPolicy,
  resolveAvailableAgentHarnessPolicy,
  resolvePluginHarnessPolicyToolsAllow,
  runAgentHarnessAttempt,
  selectAgentHarness,
  selectAgentHarnessForPreparedModelProviders,
} from "./selection.js";
import {
  buildAgentHarnessSupportContext,
  resolveAgentHarnessPreparedAuthSupport,
  resolveAgentHarnessPreparedRouteSupport,
} from "./support.js";
import type {
  AgentHarness,
  AgentHarnessCompactParams,
  AgentHarnessCompactResult,
} from "./types.js";

const agentRunAttempt = vi.fn<AgentHarness["runAttempt"]>(async () =>
  createAttemptResult("grokbot"),
);
const compactAuthMocks = vi.hoisted(() => ({
  ensureAuthProfileStore: vi.fn(),
  ensureAuthProfileStoreWithoutExternalProfiles: vi.fn(),
  getApiKeyForModel: vi.fn(),
  resolveModelAsync: vi.fn(),
}));
const providerOwnerMocks = vi.hoisted(() => ({
  resolveProviderRefOwnership: vi.fn(),
}));

// Mock grok-cli-resolver so grokCliAvailableSync() is toggleable per-test.
// Must be hoisted so it is defined when vi.mock factory runs.
const mockGrokCliAvailableSync = vi.hoisted(() => vi.fn(() => false));
// Built after mockGrokCliAvailableSync so the factory can reference it.
vi.mock("./grok-cli-resolver.js", () => ({
  grokCliAvailableSync: (): boolean => mockGrokCliAvailableSync(),
  resolveGrokCliPath: async () => "/fake/grok",
}));

it("identifies harnesses that expose GrokBot tools", () => {
  expect(agentHarnessBuildsOpenClawTools("grokbot")).toBe(false);
  expect(agentHarnessBuildsOpenClawTools("codex")).toBe(true);
  expect(agentHarnessBuildsOpenClawTools("copilot")).toBe(true);
  expect(agentHarnessBuildsOpenClawTools("custom")).toBe(false);
  expect(agentHarnessExposesOpenClawTools("grokbot")).toBe(true);
  expect(agentHarnessExposesOpenClawTools("codex")).toBe(true);
  expect(agentHarnessExposesOpenClawTools("copilot")).toBe(true);
  expect(agentHarnessExposesOpenClawTools("custom")).toBe(false);
});

vi.mock("./builtin-grokbot.js", () => ({
  createGrokBotAgentHarness: (): AgentHarness => ({
    id: "grokbot",
    label: "GrokBot embedded agent",
    contextEngineHostCapabilities: OPENCLAW_EMBEDDED_CONTEXT_ENGINE_HOST.capabilities,
    supports: () => ({ supported: true, priority: 0 }),
    runAttempt: agentRunAttempt,
  }),
}));
vi.mock("../model-auth.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../model-auth.js")>()),
  applySecretRefHeaderSentinels: (model: unknown) => model,
  ensureAuthProfileStore: compactAuthMocks.ensureAuthProfileStore,
  ensureAuthProfileStoreWithoutExternalProfiles:
    compactAuthMocks.ensureAuthProfileStoreWithoutExternalProfiles,
  getApiKeyForModel: compactAuthMocks.getApiKeyForModel,
}));
vi.mock("../embedded-agent-runner/model.js", () => ({
  resolveModelAsync: compactAuthMocks.resolveModelAsync,
}));
vi.mock("../../plugins/providers.js", () => ({
  resolveProviderRefOwnership: providerOwnerMocks.resolveProviderRefOwnership,
}));

const originalRuntime = process.env.OPENCLAW_AGENT_RUNTIME;

beforeEach(() => {
  clearAgentHarnesses();
  // Reset grok-cli mock to unavailable (false) so each test starts with a clean slate.
  // Tests that need grok-cli available must explicitly call mockReturnValue(true).
  mockGrokCliAvailableSync.mockReset();
  mockGrokCliAvailableSync.mockReturnValue(false);
  compactAuthMocks.ensureAuthProfileStore.mockReturnValue({ version: 1, profiles: {} });
  compactAuthMocks.ensureAuthProfileStoreWithoutExternalProfiles.mockReturnValue({
    version: 1,
    profiles: {},
  });
  compactAuthMocks.resolveModelAsync.mockResolvedValue({
    model: { id: "gpt-5.5", provider: "openai" },
  });
  compactAuthMocks.getApiKeyForModel.mockResolvedValue({ apiKey: "test-key" });
  providerOwnerMocks.resolveProviderRefOwnership.mockReset();
  providerOwnerMocks.resolveProviderRefOwnership.mockReturnValue({ status: "unowned" });
  cliBackendsTesting.setDepsForTest({
    resolvePluginSetupRegistry: () => ({
      providers: [],
      cliBackends: [],
      configMigrations: [],
      autoEnableProbes: [],
      diagnostics: [],
    }),
    resolveRuntimeCliBackends: () => [
      {
        id: "claude-cli",
        modelProvider: "anthropic",
        pluginId: "anthropic",
        config: { command: "claude" },
      },
      {
        id: "google-gemini-cli",
        modelProvider: "google",
        pluginId: "google",
        config: { command: "gemini" },
      },
    ],
  });
});

afterEach(() => {
  clearAgentHarnesses();
  cliBackendsTesting.resetDepsForTest();
  agentRunAttempt.mockClear();
  mockGrokCliAvailableSync.mockReset();
  compactAuthMocks.resolveModelAsync.mockReset();
  compactAuthMocks.getApiKeyForModel.mockReset();
  compactAuthMocks.ensureAuthProfileStore.mockReset();
  compactAuthMocks.ensureAuthProfileStoreWithoutExternalProfiles.mockReset();
  providerOwnerMocks.resolveProviderRefOwnership.mockReset();
  if (originalRuntime == null) {
    delete process.env.OPENCLAW_AGENT_RUNTIME;
  } else {
    process.env.OPENCLAW_AGENT_RUNTIME = originalRuntime;
  }
});

function createAttemptParams(config?: OpenClawConfig): EmbeddedRunAttemptParams {
  return {
    prompt: "hello",
    sessionId: "session-1",
    runId: "run-1",
    sessionFile: "/tmp/session.jsonl",
    workspaceDir: "/tmp/workspace",
    timeoutMs: 5_000,
    provider: "codex",
    modelId: "gpt-5.4",
    model: { id: "gpt-5.4", provider: "codex" } as Model,
    authStorage: {} as never,
    authProfileStore: { version: 1, profiles: {} },
    modelRegistry: {} as never,
    thinkLevel: "low",
    config,
  } as EmbeddedRunAttemptParams;
}

function createAttemptResult(sessionIdUsed: string): EmbeddedRunAttemptResult {
  return {
    aborted: false,
    externalAbort: false,
    timedOut: false,
    idleTimedOut: false,
    timedOutDuringCompaction: false,
    timedOutDuringToolExecution: false,
    promptError: null,
    promptErrorSource: null,
    sessionIdUsed,
    messagesSnapshot: [],
    assistantTexts: [`${sessionIdUsed} ok`],
    toolMetas: [],
    lastAssistant: undefined,
    didSendViaMessagingTool: false,
    messagingToolSentTexts: [],
    messagingToolSentMediaUrls: [],
    messagingToolSentTargets: [],
    cloudCodeAssistFormatError: false,
    replayMetadata: { hadPotentialSideEffects: false, replaySafe: true },
    itemLifecycle: { startedCount: 0, completedCount: 0, activeCount: 0 },
  };
}

function createContextEngineRequiringAssembly(): ContextEngine {
  // Selection tests use this to prove fallback cannot cross into a harness
  // that lacks required context-engine host capabilities.
  return {
    info: {
      id: "lossless-claw",
      name: "Lossless",
      hostRequirements: {
        "agent-run": {
          requiredCapabilities: ["assemble-before-prompt"],
        },
      },
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  };
}

function registerFailingCodexHarness(): void {
  // Forces the selected plugin runtime to throw so fallback behavior is
  // exercised through runAgentHarnessAttempt, not only selectAgentHarness.
  registerAgentHarness(
    {
      id: "codex",
      label: "Failing Codex",
      supports: (ctx) =>
        ctx.provider === "codex" ? { supported: true, priority: 100 } : { supported: false },
      runAttempt: vi.fn(async () => {
        throw new Error("codex startup failed");
      }),
    },
    { ownerPluginId: "codex" },
  );
}

function registerSuccessfulCodexHarness(): void {
  registerAgentHarness(
    {
      id: "codex",
      label: "Codex",
      supports: (ctx) =>
        ctx.provider === "codex" || ctx.provider === "openai"
          ? { supported: true, priority: 100 }
          : { supported: false },
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    },
    { ownerPluginId: "codex" },
  );
}

function groupSenderDenyAllConfig(): OpenClawConfig {
  // Mirrors Telegram sender policy shape used when selection must preserve
  // channel/group sender tool constraints across fallback attempts.
  return {
    channels: {
      telegram: {
        groups: {
          "test-deny-room": {
            toolsBySender: {
              "id:test-denied-sender": { deny: ["*"] },
            },
          },
        },
      },
    },
  } as OpenClawConfig;
}

function groupDenyAllConfig(): OpenClawConfig {
  return {
    channels: {
      telegram: {
        groups: {
          "test-deny-room": {
            tools: { deny: ["*"] },
          },
        },
      },
    },
  } as OpenClawConfig;
}

function providerRuntimeConfig(provider: string, runtime: string): OpenClawConfig {
  return {
    models: {
      providers: {
        [provider]: {
          baseUrl: "https://api.openai.com/v1",
          agentRuntime: { id: runtime },
          models: [],
        },
      },
    },
  } as OpenClawConfig;
}

function agentModelRuntimeConfig(
  modelRef: string,
  runtime: string,
  agentId?: string,
): OpenClawConfig {
  if (agentId) {
    return {
      agents: {
        list: [
          { id: "main", default: true },
          { id: agentId, models: { [modelRef]: { agentRuntime: { id: runtime } } } },
        ],
      },
    } as OpenClawConfig;
  }
  return {
    agents: {
      defaults: {
        models: {
          [modelRef]: { agentRuntime: { id: runtime } },
        },
      },
    },
  } as OpenClawConfig;
}

type CompactSessionParams = Parameters<typeof maybeCompactAgentHarnessSession>[0];

const OPENAI_PLATFORM_ROUTE = {
  provider: "openai",
  modelId: "gpt-5.5",
  api: "openai-responses",
  baseUrl: "https://api.openai.com/v1",
  authRequirement: "api-key",
  requestTransportOverrides: "none",
} as const;

const OPENAI_CHATGPT_ROUTE = {
  provider: "openai",
  modelId: "gpt-5.5",
  api: "openai-chatgpt-responses",
  baseUrl: "https://chatgpt.com/backend-api/codex",
  authRequirement: "subscription",
  requestTransportOverrides: "none",
} as const;

function createCompactionParams(
  overrides: Partial<CompactSessionParams> = {},
): CompactSessionParams {
  return {
    sessionId: "session-1",
    sessionKey: "agent:main:main",
    sessionFile: "/tmp/session.jsonl",
    workspaceDir: "/tmp/workspace",
    provider: "openai",
    model: "gpt-5.5",
    ...overrides,
  };
}

function registerTestCompactor(
  options: {
    id?: string;
    provider?: string;
    authBootstrap?: AgentHarness["authBootstrap"];
    supports?: AgentHarness["supports"];
    result?: AgentHarnessCompactResult;
  } = {},
) {
  const id = options.id ?? "codex";
  const provider = options.provider ?? "openai";
  const compact = vi.fn<NonNullable<AgentHarness["compact"]>>(
    async () => options.result ?? { ok: true, compacted: false },
  );
  registerAgentHarness(
    {
      id,
      label: id,
      supports:
        options.supports ??
        ((ctx) =>
          ctx.provider === provider ? { supported: true, priority: 100 } : { supported: false }),
      runAttempt: vi.fn(async () => createAttemptResult(id)),
      compact,
      ...(options.authBootstrap ? { authBootstrap: options.authBootstrap } : {}),
    },
    { ownerPluginId: id },
  );
  return compact;
}

describe("runAgentHarnessAttempt", () => {
  it.each(["codex", "copilot"] as const)(
    "binds the host GrokBot tool to the %s SDK construction path without leaking authority",
    async (harnessId) => {
      let receivedPrivateAuthority = true;
      let hostScopeActive = false;
      let toolNames: string[] = [];
      const pluginRunAttempt = vi.fn<AgentHarness["runAttempt"]>(async (attemptParams) => {
        receivedPrivateAuthority = "systemAgentTool" in attemptParams;
        await Promise.resolve();
        hostScopeActive = isHostScopedAgentToolActive("grokbot");
        toolNames = createOpenClawCodingTools({
          config: { tools: { allow: ["read"], deny: ["grokbot"], toolSearch: true } },
          runtimeToolAllowlist: ["grokbot"],
          toolConstructionPlan: {
            includeBaseCodingTools: false,
            includeShellTools: false,
            includeChannelTools: false,
            includeOpenClawTools: true,
            includePluginTools: false,
          },
        }).map((tool) => tool.name);
        return createAttemptResult(harnessId);
      });
      registerAgentHarness(
        {
          id: harnessId,
          label: harnessId,
          supports: () => ({ supported: true, priority: 100 }),
          runAttempt: pluginRunAttempt,
        },
        { ownerPluginId: harnessId },
      );
      const params = createAttemptParams(
        providerRuntimeConfig("codex", harnessId),
      ) as EmbeddedRunAttemptParams & { systemAgentTool?: SystemAgentToolOptions };
      params.toolsAllow = ["grokbot"];
      params.systemAgentTool = { surface: "cli", proposalRef: {}, directiveRef: {} };

      await runAgentHarnessAttempt(params);

      expect(pluginRunAttempt).toHaveBeenCalledTimes(1);
      expect(receivedPrivateAuthority).toBe(false);
      expect(hostScopeActive).toBe(true);
      expect(toolNames).toEqual(["grokbot"]);
      expect(isHostScopedAgentToolActive("grokbot")).toBe(false);
    },
  );

  it.each([
    { name: "missing", toolsAllow: undefined },
    { name: "broad", toolsAllow: ["grokbot", "read"] },
  ])("rejects $name allowlists for private GrokBot authority", async ({ toolsAllow }) => {
    const pluginRunAttempt = vi.fn<AgentHarness["runAttempt"]>(async () =>
      createAttemptResult("codex"),
    );
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: () => ({ supported: true, priority: 100 }),
        runAttempt: pluginRunAttempt,
      },
      { ownerPluginId: "codex" },
    );
    const params = createAttemptParams(
      providerRuntimeConfig("codex", "codex"),
    ) as EmbeddedRunAttemptParams & { systemAgentTool?: SystemAgentToolOptions };
    params.toolsAllow = toolsAllow;
    params.systemAgentTool = { surface: "cli", proposalRef: {}, directiveRef: {} };

    await expect(runAgentHarnessAttempt(params)).rejects.toThrow(
      'GrokBot host authority requires toolsAllow: ["grokbot"]',
    );
    expect(pluginRunAttempt).not.toHaveBeenCalled();
    expect(isHostScopedAgentToolActive("grokbot")).toBe(false);
  });

  it("keeps the host GrokBot allowlist across global, agent, and sandbox deny-all policy", async () => {
    const received: Array<{
      toolsAllow: string[] | undefined;
      extraSystemPrompt: string | undefined;
      hostScopeActive: boolean;
    }> = [];
    const pluginRunAttempt = vi.fn<AgentHarness["runAttempt"]>(async (attemptParams) => {
      received.push({
        toolsAllow: attemptParams.toolsAllow,
        extraSystemPrompt: attemptParams.extraSystemPrompt,
        hostScopeActive: isHostScopedAgentToolActive("grokbot"),
      });
      return createAttemptResult("codex");
    });
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: () => ({ supported: true, priority: 100 }),
        runAttempt: pluginRunAttempt,
      },
      { ownerPluginId: "codex" },
    );
    const cases: Array<{
      config: OpenClawConfig;
      agentId?: string;
      sessionKey?: string;
    }> = [
      { config: { tools: { deny: ["*"] } } as OpenClawConfig },
      {
        config: {
          agents: { list: [{ id: "worker", tools: { deny: ["*"] } }] },
        } as OpenClawConfig,
        agentId: "worker",
      },
      {
        config: {
          agents: { defaults: { sandbox: { mode: "all" } } },
          tools: { sandbox: { tools: { deny: ["*"] } } },
        } as OpenClawConfig,
        sessionKey: "agent:main:session-1",
      },
    ];

    for (const [index, testCase] of cases.entries()) {
      const params = createAttemptParams(testCase.config) as EmbeddedRunAttemptParams & {
        systemAgentTool?: SystemAgentToolOptions;
      };
      params.sessionId = `session-${index}`;
      params.agentHarnessRuntimeOverride = "codex";
      params.agentId = testCase.agentId;
      params.sessionKey = testCase.sessionKey;
      params.toolsAllow = ["grokbot"];
      params.systemAgentTool = { surface: "cli", proposalRef: {}, directiveRef: {} };
      await runAgentHarnessAttempt(params);
    }

    expect(received).toEqual([
      { toolsAllow: ["grokbot"], extraSystemPrompt: undefined, hostScopeActive: true },
      { toolsAllow: ["grokbot"], extraSystemPrompt: undefined, hostScopeActive: true },
      { toolsAllow: ["grokbot"], extraSystemPrompt: undefined, hostScopeActive: true },
    ]);
    expect(isHostScopedAgentToolActive("grokbot")).toBe(false);
  });

  it("binds the same host GrokBot scope to the built-in GrokBot harness", async () => {
    let toolNames: string[] = [];
    agentRunAttempt.mockImplementationOnce(async () => {
      await Promise.resolve();
      toolNames = createOpenClawCodingTools({
        config: { tools: { allow: ["read"], deny: ["grokbot"], toolSearch: true } },
        runtimeToolAllowlist: ["grokbot"],
        toolConstructionPlan: {
          includeBaseCodingTools: false,
          includeShellTools: false,
          includeChannelTools: false,
          includeOpenClawTools: true,
          includePluginTools: false,
        },
      }).map((tool) => tool.name);
      return createAttemptResult("grokbot");
    });
    const params = createAttemptParams(
      providerRuntimeConfig("codex", "grokbot"),
    ) as EmbeddedRunAttemptParams & { systemAgentTool?: SystemAgentToolOptions };
    params.toolsAllow = ["grokbot"];
    params.systemAgentTool = { surface: "gateway", proposalRef: {}, directiveRef: {} };

    const result = await runAgentHarnessAttempt(params);

    expect(result.sessionIdUsed).toBe("grokbot");
    expect(toolNames).toEqual(["grokbot"]);
    expect(isHostScopedAgentToolActive("grokbot")).toBe(false);
  });

  it("unwraps sentinels only at the plugin harness handoff", async () => {
    const pluginRunAttempt = vi.fn<AgentHarness["runAttempt"]>(async () =>
      createAttemptResult("codex"),
    );
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: () => ({ supported: true, priority: 100 }),
        runAttempt: pluginRunAttempt,
      },
      { ownerPluginId: "codex" },
    );
    const secret = "plugin-provider-secret";
    const sentinel = mintSecretSentinel(secret, { label: "model-auth:codex" });
    const params = createAttemptParams(providerRuntimeConfig("codex", "codex"));
    params.resolvedApiKey = sentinel;
    params.model = {
      ...params.model,
      headers: { Authorization: `Bearer ${sentinel}`, "X-Optional": null } as never,
    };

    await runAgentHarnessAttempt(params);

    const handedOff = pluginRunAttempt.mock.calls[0]?.[0];
    expect(handedOff?.resolvedApiKey).toBe(secret);
    expect(handedOff?.model.headers?.Authorization).toBe(`Bearer ${secret}`);
    expect(handedOff?.model.headers?.["X-Optional"]).toBeNull();
    expect(params.resolvedApiKey).toBe(sentinel);
  });

  it("fails when a forced plugin harness is unavailable and fallback is omitted", async () => {
    process.env.OPENCLAW_AGENT_RUNTIME = "codex";

    await expect(
      runAgentHarnessAttempt(createAttemptParams(providerRuntimeConfig("codex", "codex"))),
    ).rejects.toThrow('Requested agent harness "codex" is not registered.');
    expect(agentRunAttempt).not.toHaveBeenCalled();
  });

  it("auto mode prefers grok-cli over embedded grokbot when both are available (Pi replacement)", async () => {
    // With Grok Build CLI available on PATH, grok-cli harness (priority 30) wins
    // over embedded grokbot (priority 0). The Pi agent harness is entirely replaced —
    // there is no longer a third option to fall back to.
    mockGrokCliAvailableSync.mockReturnValue(true);
    const result = await runAgentHarnessAttempt(createAttemptParams());

    expect(result.sessionIdUsed).toBe("grok-cli");
    expect(agentRunAttempt).toHaveBeenCalledTimes(1);
  });

  it("auto mode throws when no Grok Build CLI or plugin harness is available (no Pi fallback)", async () => {
    // Pi agent harness is entirely replaced by Grok Build CLI. Auto mode must never
    // silently dispatch to the removed Pi agent surface. If neither grok-cli nor any
    // registered plugin harness supports the request, fail loud so the operator
    // can install grok-cli (curl -fsSL https://x.ai/cli/install.sh | bash) or
    // register a plugin harness, instead of the call silently succeeding.
    mockGrokCliAvailableSync.mockReturnValue(false);
    await expect(runAgentHarnessAttempt(createAttemptParams())).rejects.toThrow(
      /Install the Grok Build CLI|register a plugin harness/,
    );
  });

  it("allows the selected GrokBot harness to satisfy context-engine pre-prompt assembly", async () => {
    const result = await runAgentHarnessAttempt({
      ...createAttemptParams(providerRuntimeConfig("codex", "grokbot")),
      contextEngine: createContextEngineRequiringAssembly(),
    });

    expect(result.sessionIdUsed).toBe("grokbot");
    expect(agentRunAttempt).toHaveBeenCalledTimes(1);
  });

  it("surfaces an auto-selected plugin harness failure instead of replaying through GrokBot", async () => {
    registerFailingCodexHarness();

    await expect(runAgentHarnessAttempt(createAttemptParams())).rejects.toThrow(
      "codex startup failed",
    );
    expect(agentRunAttempt).not.toHaveBeenCalled();
  });

  it("auto-selects a supporting plugin harness by default", async () => {
    registerFailingCodexHarness();

    await expect(runAgentHarnessAttempt(createAttemptParams())).rejects.toThrow(
      "codex startup failed",
    );
    expect(agentRunAttempt).not.toHaveBeenCalled();
  });

  it("projects deferred route support into the final attempt selection", async () => {
    const supports = vi.fn((ctx: Parameters<AgentHarness["supports"]>[0]) =>
      ctx.modelProvider?.preparedAuth?.source === "harness" &&
      ctx.modelProvider.requestTransportOverrides === "none" &&
      ctx.modelProvider.runtimePolicy?.compatibleIds.includes("codex")
        ? { supported: true as const, priority: 100 }
        : { supported: false as const, reason: "prepared route support is missing" },
    );
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports,
        runAttempt: vi.fn(async () => createAttemptResult("codex")),
      },
      { ownerPluginId: "codex" },
    );
    const params = createAttemptParams();
    params.provider = "openai";
    params.modelId = "gpt-5.5";
    params.model = {
      id: "gpt-5.5",
      provider: "openai",
      api: "openai-responses",
      baseUrl: "https://api.openai.com/v1",
    } as Model;
    params.agentHarnessRuntimeOverride = "codex";
    params.runtimePlan = {
      auth: {
        providerForAuth: "openai",
        authProfileProviderForAuth: "openai",
        harnessAuthProvider: "openai",
        deferredRouteSupport: {
          requestTransportOverrides: "none",
          runtimePolicy: { compatibleIds: ["grokbot", "codex"] },
        },
      },
    } as never;

    await expect(runAgentHarnessAttempt(params)).resolves.toMatchObject({
      sessionIdUsed: "codex",
    });
    expect(supports).toHaveBeenCalledWith(
      expect.objectContaining({
        modelProvider: expect.objectContaining({
          requestTransportOverrides: "none",
          runtimePolicy: { compatibleIds: ["grokbot", "codex"] },
          preparedAuth: { source: "harness" },
        }),
      }),
    );
  });

  it("surfaces a forced plugin harness failure instead of replaying through GrokBot", async () => {
    registerFailingCodexHarness();

    await expect(
      runAgentHarnessAttempt(createAttemptParams(providerRuntimeConfig("codex", "codex"))),
    ).rejects.toThrow("codex startup failed");
    expect(agentRunAttempt).not.toHaveBeenCalled();
  });

  it("rejects the candidate when the forced plugin harness does not support its provider", async () => {
    registerFailingCodexHarness();

    const params = createAttemptParams(
      agentModelRuntimeConfig("9router/cc/claude-opus-4-6", "codex"),
    );
    params.provider = "9router";
    params.modelId = "cc/claude-opus-4-6";
    params.agentHarnessRuntimeOverride = "codex";

    await expect(runAgentHarnessAttempt(params)).rejects.toThrow(
      /Requested agent harness "codex" does not support 9router\/cc\/claude-opus-4-6/,
    );
    expect(agentRunAttempt).not.toHaveBeenCalled();
  });

  it("keeps a session-pinned Codex harness across outer provider overrides", async () => {
    registerSuccessfulCodexHarness();

    const result = await runAgentHarnessAttempt({
      ...createAttemptParams(),
      provider: "anthropic",
      modelId: "claude-opus-4-6",
      agentHarnessId: "codex",
    });

    expect(result.sessionIdUsed).toBe("codex");
    expect(agentRunAttempt).not.toHaveBeenCalled();
  });

  it("fails closed when a session-pinned Codex harness is unavailable", async () => {
    await expect(
      runAgentHarnessAttempt({
        ...createAttemptParams(),
        provider: "anthropic",
        modelId: "claude-opus-4-6",
        agentHarnessId: "codex",
      }),
    ).rejects.toThrow('Requested agent harness "codex" is not registered');
    expect(agentRunAttempt).not.toHaveBeenCalled();
  });

  it.each(["openai", "openai"])(
    "does not override forced Codex harness support rejection for %s",
    (provider) => {
      registerFailingCodexHarness();

      expect(() =>
        selectAgentHarness({
          provider,
          modelId: "gpt-5.4",
          agentHarnessRuntimeOverride: "codex",
        }),
      ).toThrow(`Requested agent harness "codex" does not support ${provider}/gpt-5.4`);
      expect(agentRunAttempt).not.toHaveBeenCalled();
    },
  );

  it("uses the Codex harness by default for OpenAI agent model runs", async () => {
    registerSuccessfulCodexHarness();

    expect(resolveAgentHarnessPolicy({ provider: "openai", modelId: "gpt-5.4" })).toEqual({
      runtime: "codex",
      runtimeSource: "implicit",
    });

    const result = await runAgentHarnessAttempt({
      ...createAttemptParams(),
      provider: "openai",
      modelId: "gpt-5.4",
    });
    expect(result.sessionIdUsed).toBe("codex");
    expect(agentRunAttempt).not.toHaveBeenCalled();
  });

  it("auto mode throws when implicit OpenAI Codex is unavailable and no Grok Build CLI is installed", async () => {
    // No codex plugin harness registered, no Grok Build CLI installed. The Pi
    // agent fallback path is entirely replaced — auto selection must throw so
    // the operator can install grok-cli instead of the call silently succeeding.
    mockGrokCliAvailableSync.mockReturnValue(false);
    expect(resolveAgentHarnessPolicy({ provider: "openai", modelId: "gpt-5.4" })).toEqual({
      runtime: "codex",
      runtimeSource: "implicit",
    });
    expect(resolveAvailableAgentHarnessPolicy({ provider: "openai", modelId: "gpt-5.4" })).toEqual({
      runtime: "grokbot",
      runtimeSource: "implicit",
    });

    await expect(
      runAgentHarnessAttempt({
        ...createAttemptParams(),
        provider: "openai",
        modelId: "gpt-5.4",
      }),
    ).rejects.toThrow(/Install the Grok Build CLI|register a plugin harness/);
  });

  it("honors explicit GrokBot runtime for OpenAI agent model runs", async () => {
    const result = await runAgentHarnessAttempt({
      ...createAttemptParams(providerRuntimeConfig("openai", "grokbot")),
      provider: "openai",
      modelId: "gpt-5.4",
    });
    expect(result.sessionIdUsed).toBe("grokbot");
    expect(agentRunAttempt).toHaveBeenCalledTimes(1);
  });

  it("honors provider wildcard GrokBot runtime policy for OpenAI agent model runs", async () => {
    registerSuccessfulCodexHarness();

    const result = await runAgentHarnessAttempt({
      ...createAttemptParams(agentModelRuntimeConfig("openai/*", "grokbot")),
      provider: "openai",
      modelId: "gpt-5.4",
    });
    expect(result.sessionIdUsed).toBe("grokbot");
    expect(agentRunAttempt).toHaveBeenCalledTimes(1);
  });

  it("annotates non-ok harness result classifications for outer model fallback", async () => {
    const classify = vi.fn<NonNullable<AgentHarness["classify"]>>(() => "empty" as const);
    registerAgentHarness(
      {
        id: "codex",
        label: "Classifying Codex",
        supports: (ctx) =>
          ctx.provider === "codex" ? { supported: true, priority: 100 } : { supported: false },
        runAttempt: vi.fn(async () => createAttemptResult("codex")),
        classify,
      },
      { ownerPluginId: "codex" },
    );

    const params = createAttemptParams();
    const result = await runAgentHarnessAttempt(params);

    const classifyCall = classify.mock.calls.at(0);
    expect(classifyCall?.[0].sessionIdUsed).toBe("codex");
    expect(classifyCall?.[1]).toBe(params);
    expect(result.agentHarnessId).toBe("codex");
    expect(result.agentHarnessResultClassification).toBe("empty");
  });

  it("collapses channel group sender deny-all to empty toolsAllow for plugin harnesses", async () => {
    const runAttempt = vi.fn<AgentHarness["runAttempt"]>(async () => createAttemptResult("codex"));
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: (ctx) =>
          ctx.provider === "codex" ? { supported: true, priority: 100 } : { supported: false },
        runAttempt,
      },
      { ownerPluginId: "codex" },
    );

    await runAgentHarnessAttempt({
      ...createAttemptParams(groupSenderDenyAllConfig()),
      sessionKey: "agent:main:telegram:group:test-deny-room",
      messageProvider: "telegram",
      groupId: "test-deny-room",
      senderId: "test-denied-sender",
      extraSystemPrompt: "Existing operator note.",
    });

    expect(runAttempt).toHaveBeenCalledTimes(1);
    const attempt = runAttempt.mock.calls[0]?.[0];
    expect(attempt?.toolsAllow).toEqual([]);
    expect(attempt?.extraSystemPrompt).toContain("Existing operator note.");
    expect(attempt?.extraSystemPrompt).toContain("this sender is not allowed by policy");
  });

  it("adds chat policy wording for plugin harness group deny-all", async () => {
    const runAttempt = vi.fn<AgentHarness["runAttempt"]>(async () => createAttemptResult("codex"));
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: (ctx) =>
          ctx.provider === "codex" ? { supported: true, priority: 100 } : { supported: false },
        runAttempt,
      },
      { ownerPluginId: "codex" },
    );

    await runAgentHarnessAttempt({
      ...createAttemptParams(groupDenyAllConfig()),
      sessionKey: "agent:main:telegram:group:test-deny-room",
      messageProvider: "telegram",
      groupId: "test-deny-room",
      senderId: "test-denied-sender",
    });

    expect(runAttempt).toHaveBeenCalledTimes(1);
    const attempt = runAttempt.mock.calls[0]?.[0];
    expect(attempt?.toolsAllow).toEqual([]);
    expect(attempt?.extraSystemPrompt).toContain("this chat is not allowed by policy");
  });

  it.each([
    {
      name: "narrow allowlist",
      config: { tools: { allow: ["message"] } } as OpenClawConfig,
    },
    {
      name: "specific denylist",
      config: { tools: { deny: ["exec"] } } as OpenClawConfig,
    },
    {
      name: "narrow profile",
      config: { tools: { profile: "coding" } } as OpenClawConfig,
    },
  ])("marks plugin side questions restricted for a $name", ({ config }) => {
    expect(resolvePluginHarnessPolicyToolsAllow(createAttemptParams(config))).toEqual([]);
  });

  it.each([
    { name: "full tool profile", config: { tools: { profile: "full" } } as OpenClawConfig },
    { name: "explicit empty allowlist", config: { tools: { allow: [] } } as OpenClawConfig },
  ])("leaves plugin side questions unrestricted for an $name", ({ config }) => {
    expect(resolvePluginHarnessPolicyToolsAllow(createAttemptParams(config))).toBeUndefined();
  });

  it("leaves owner WebChat unrestricted by wildcard sender policy for plugin harnesses", () => {
    const config = {
      tools: {
        toolsBySender: {
          "*": { deny: ["*"] },
        },
      },
    } as OpenClawConfig;

    expect(
      resolvePluginHarnessPolicyToolsAllow({
        ...createAttemptParams(config),
        messageProvider: "webchat",
        senderIsOwner: true,
      }),
    ).toBeUndefined();
  });

  it("keeps non-owner WebChat restricted by wildcard sender policy for plugin harnesses", () => {
    const config = {
      tools: {
        toolsBySender: {
          "*": { deny: ["*"] },
        },
      },
    } as OpenClawConfig;

    expect(
      resolvePluginHarnessPolicyToolsAllow({
        ...createAttemptParams(config),
        messageProvider: "webchat",
        senderIsOwner: false,
      }),
    ).toEqual([]);
  });

  it("leaves GrokBot harness params unchanged for channel group sender deny-all policy", async () => {
    await runAgentHarnessAttempt({
      ...createAttemptParams(groupSenderDenyAllConfig()),
      sessionKey: "agent:main:telegram:group:test-deny-room",
      messageProvider: "telegram",
      groupId: "test-deny-room",
      senderId: "test-denied-sender",
    });

    expect(agentRunAttempt).toHaveBeenCalledTimes(1);
    expect(agentRunAttempt.mock.calls[0]?.[0].toolsAllow).toBeUndefined();
  });

  it("fails for config-forced plugin harnesses when fallback is omitted", async () => {
    await expect(
      runAgentHarnessAttempt(createAttemptParams(providerRuntimeConfig("codex", "codex"))),
    ).rejects.toThrow('Requested agent harness "codex" is not registered');
    expect(agentRunAttempt).not.toHaveBeenCalled();
  });

  it("does not let a strict agent model plugin runtime fall back to GrokBot", async () => {
    await expect(
      runAgentHarnessAttempt({
        ...createAttemptParams(agentModelRuntimeConfig("codex/gpt-5.4", "codex", "strict")),
        sessionKey: "agent:strict:session-1",
      }),
    ).rejects.toThrow('Requested agent harness "codex" is not registered');
    expect(agentRunAttempt).not.toHaveBeenCalled();
  });
});

describe("selectAgentHarness", () => {
  it("does not select Codex from a non-OpenAI model name", () => {
    registerSuccessfulCodexHarness();

    expect(resolveAgentHarnessPolicy({ provider: "custom", modelId: "gpt-5.4-codex" })).toEqual({
      runtime: "auto",
      runtimeSource: "implicit",
    });
    expect(selectAgentHarness({ provider: "custom", modelId: "gpt-5.4-codex" }).id).toBe(
      "grokbot",
    );
  });

  it("auto-selects plugin support by default", () => {
    const supports = vi.fn(() => ({ supported: true as const, priority: 100 }));
    registerAgentHarness({
      id: "codex",
      label: "Codex",
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    });

    const harness = selectAgentHarness({
      provider: "codex",
      modelId: "gpt-5.4",
    });

    expect(harness.id).toBe("codex");
    expect(supports).toHaveBeenCalledTimes(1);
  });

  it("rejects statically unrelated auto harnesses before provider discovery", () => {
    const supports = vi.fn(() => ({ supported: true as const, priority: 100 }));
    registerAgentHarness({
      id: "codex",
      label: "Codex",
      autoSelection: { providerIds: ["openai", "codex"] },
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    });

    expect(selectAgentHarness({ provider: "deepseek", modelId: "deepseek-v4-pro" }).id).toBe(
      "grokbot",
    );
    expect(supports).not.toHaveBeenCalled();
    expect(providerOwnerMocks.resolveProviderRefOwnership).not.toHaveBeenCalled();
  });

  it("auto-selects the highest-priority plugin harness without duplicate support probes", () => {
    const lowPrioritySupports = vi.fn(() => ({
      supported: true as const,
      priority: 10,
      reason: "generic codex support",
    }));
    const highPrioritySupports = vi.fn(() => ({
      supported: true as const,
      priority: 100,
      reason: "native codex app-server",
    }));
    const unsupportedSupports = vi.fn(() => ({
      supported: false as const,
      reason: "provider mismatch",
    }));
    registerAgentHarness(
      {
        id: "codex-low",
        label: "Low Codex",
        supports: lowPrioritySupports,
        runAttempt: vi.fn(async () => createAttemptResult("codex-low")),
      },
      { ownerPluginId: "codex-low" },
    );
    registerAgentHarness(
      {
        id: "codex-high",
        label: "High Codex",
        supports: highPrioritySupports,
        runAttempt: vi.fn(async () => createAttemptResult("codex-high")),
      },
      { ownerPluginId: "codex-high" },
    );
    registerAgentHarness(
      {
        id: "other",
        label: "Other Harness",
        supports: unsupportedSupports,
        runAttempt: vi.fn(async () => createAttemptResult("other")),
      },
      { ownerPluginId: "other" },
    );

    const harness = selectAgentHarness({
      provider: "codex",
      modelId: "gpt-5.4",
    });

    expect(harness.id).toBe("codex-high");
    expect(lowPrioritySupports).toHaveBeenCalledTimes(1);
    expect(highPrioritySupports).toHaveBeenCalledTimes(1);
    expect(unsupportedSupports).toHaveBeenCalledTimes(1);
  });

  it("honors session-level GrokBot pins when selecting a harness", () => {
    const supports = vi.fn(() => ({ supported: true as const, priority: 100 }));
    registerAgentHarness({
      id: "codex",
      label: "Codex",
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    });

    const harness = selectAgentHarness({
      provider: "codex",
      modelId: "gpt-5.4",
      agentHarnessId: "grokbot",
    });

    expect(harness.id).toBe("grokbot");
    expect(supports).not.toHaveBeenCalled();
  });

  it("passes manifest provider owners into plugin support checks", () => {
    providerOwnerMocks.resolveProviderRefOwnership.mockReturnValue({
      status: "owned",
      pluginIds: ["fixture-owner"],
    });
    const supports = vi.fn(() => ({
      supported: false as const,
      reason: "provider is owned by a native plugin",
    }));
    const config = providerRuntimeConfig("fixture-provider", "copilot");
    registerAgentHarness({
      id: "copilot",
      label: "Copilot",
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("copilot")),
    });

    expect(() =>
      selectAgentHarness({
        provider: "fixture-provider",
        modelId: "fixture-model",
        config,
        agentHarnessRuntimeOverride: "copilot",
      }),
    ).toThrow("provider is owned by a native plugin");

    expect(providerOwnerMocks.resolveProviderRefOwnership).toHaveBeenCalledWith({
      provider: "fixture-provider",
      config,
    });
    expect(supports).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "fixture-provider",
        modelId: "fixture-model",
        requestedRuntime: "copilot",
        providerOwnerStatus: "owned",
        providerOwnerPluginIds: ["fixture-owner"],
      }),
    );
  });

  it("passes ambiguous provider ownership into plugin support checks", () => {
    providerOwnerMocks.resolveProviderRefOwnership.mockReturnValue({
      status: "ambiguous",
      pluginIds: ["first-owner", "second-owner"],
    });
    const supports = vi.fn(() => ({
      supported: false as const,
      reason: "provider ownership is ambiguous",
    }));
    const config = providerRuntimeConfig("custom-proxy", "copilot");
    registerAgentHarness({
      id: "copilot",
      label: "Copilot",
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("copilot")),
    });

    expect(() =>
      selectAgentHarness({
        provider: "custom-proxy",
        modelId: "proxy-model",
        config,
        agentHarnessRuntimeOverride: "copilot",
      }),
    ).toThrow("provider ownership is ambiguous");

    expect(supports).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "custom-proxy",
        providerOwnerStatus: "ambiguous",
        providerOwnerPluginIds: ["first-owner", "second-owner"],
      }),
    );
  });

  it("passes resolved provider model shape into plugin support checks", () => {
    const supports = vi.fn(() => ({
      supported: false as const,
      reason: "unsupported test provider",
    }));
    const config = {
      models: {
        providers: {
          "custom-proxy": {
            api: "openai-completions",
            baseUrl: "https://provider.example/v1",
            request: { auth: { mode: "provider-default" as const } },
            agentRuntime: { id: "copilot" },
            models: [
              {
                id: "gpt-test",
                name: "GPT Test",
                api: "openai-responses",
                baseUrl: "https://model.example/v1",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 8_192,
                maxTokens: 1_024,
              },
            ],
          },
        },
      },
    } as OpenClawConfig;
    registerAgentHarness({
      id: "copilot",
      label: "Copilot",
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("copilot")),
    });

    expect(() =>
      selectAgentHarness({
        provider: "custom-proxy",
        modelId: "gpt-test",
        config,
        agentHarnessRuntimeOverride: "copilot",
      }),
    ).toThrow("unsupported test provider");

    expect(supports).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "custom-proxy",
        modelId: "gpt-test",
        modelProvider: expect.objectContaining({
          api: "openai-responses",
          baseUrl: "https://model.example/v1",
          request: { auth: { mode: "provider-default" } },
        }),
      }),
    );
  });

  it("merges prepared model route facts with configured request policy", () => {
    const supports = vi.fn(() => ({
      supported: false as const,
      reason: "unsupported test provider",
    }));
    const config = {
      models: {
        providers: {
          "custom-proxy": {
            api: "openai-completions",
            baseUrl: "https://provider.example/v1",
            request: { auth: { mode: "provider-default" as const } },
            agentRuntime: { id: "copilot" },
            models: [
              {
                id: "gpt-test",
                name: "GPT Test",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 8_192,
                maxTokens: 1_024,
              },
            ],
          },
        },
      },
    } as OpenClawConfig;
    registerAgentHarness({
      id: "copilot",
      label: "Copilot",
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("copilot")),
    });

    expect(() =>
      selectAgentHarness({
        provider: "custom-proxy",
        modelId: "gpt-test",
        modelProvider: {
          api: "openai-responses",
          baseUrl: "https://model.example/v1",
        },
        config,
        agentHarnessRuntimeOverride: "copilot",
      }),
    ).toThrow("unsupported test provider");

    expect(supports).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "custom-proxy",
        modelId: "gpt-test",
        modelProvider: expect.objectContaining({
          api: "openai-responses",
          baseUrl: "https://model.example/v1",
          requestTransportOverrides: "present",
          request: { auth: { mode: "provider-default" } },
        }),
      }),
    );
  });

  it("projects a self-qualified model adapter and transport into harness capability checks", () => {
    const config = {
      models: {
        providers: {
          openai: {
            api: "openai-responses",
            baseUrl: "https://api.openai.com/v1",
            models: [
              {
                id: "openai/gpt-5.5",
                api: "openai-completions",
                headers: { "x-model-route": "custom" },
              },
            ],
          },
        },
      },
    } as unknown as OpenClawConfig;

    expect(
      buildAgentHarnessSupportContext({
        provider: "openai",
        modelId: "gpt-5.5",
        requestedRuntime: "codex",
        config,
      }).modelProvider,
    ).toMatchObject({
      api: "openai-completions",
      requestTransportOverrides: "present",
      runtimePolicy: { compatibleIds: ["grokbot"] },
    });
  });

  it("projects canonical model transport overrides for a shipped alias", () => {
    const config = {
      models: {
        providers: {
          openai: {
            models: [
              {
                id: "gpt-5.4",
                api: "openai-completions",
                baseUrl: "https://api.openai.com/v1",
                headers: { "x-model-route": "custom" },
              },
            ],
          },
        },
      },
    } as unknown as OpenClawConfig;

    expect(
      buildAgentHarnessSupportContext({
        provider: "openai",
        modelId: "gpt-5.4-codex",
        requestedRuntime: "codex",
        config,
      }).modelProvider,
    ).toMatchObject({
      api: "openai-completions",
      baseUrl: "https://api.openai.com/v1",
      requestTransportOverrides: "present",
      runtimePolicy: { compatibleIds: ["grokbot"] },
    });
  });

  it("projects provider-owned compatibility for an official OpenAI route", () => {
    expect(
      buildAgentHarnessSupportContext({
        provider: "openai",
        modelId: "gpt-5.5",
        modelProvider: {
          api: "openai-responses",
          baseUrl: "https://api.openai.com/v1",
        },
        requestedRuntime: "codex",
      }).modelProvider,
    ).toMatchObject({
      runtimePolicy: { compatibleIds: ["grokbot", "codex"] },
    });
  });

  it.each([
    {
      label: "default",
      config: { agents: { defaults: { params: { store: false } } } },
      identity: {},
    },
    {
      label: "model",
      config: {
        agents: {
          defaults: {
            models: { "openai/gpt-5.5": { params: { store: false } } },
          },
        },
      },
      identity: {},
    },
    {
      label: "agent",
      config: {
        agents: { list: [{ id: "worker", params: { store: false } }] },
      },
      identity: { sessionKey: "agent:worker:main" },
    },
  ] as const)(
    "projects $label agent request params into harness support",
    ({ config, identity }) => {
      expect(
        buildAgentHarnessSupportContext({
          provider: "openai",
          modelId: "gpt-5.5",
          modelProvider: {
            api: "openai-responses",
            baseUrl: "https://api.openai.com/v1",
            requestTransportOverrides: "none",
          },
          requestedRuntime: "codex",
          config: config as OpenClawConfig,
          ...identity,
        }).modelProvider,
      ).toMatchObject({
        requestTransportOverrides: "present",
        runtimePolicy: { compatibleIds: ["grokbot"] },
      });
    },
  );

  it("rejects explicit Codex when agent request params cannot be reproduced", () => {
    const supports = vi.fn((ctx: Parameters<AgentHarness["supports"]>[0]) =>
      ctx.modelProvider?.requestTransportOverrides === "present"
        ? { supported: false as const, reason: "authored request params are unsupported" }
        : { supported: true as const },
    );
    registerAgentHarness({
      id: "codex",
      label: "Codex",
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    });

    expect(() =>
      selectAgentHarness({
        provider: "openai",
        modelId: "gpt-5.5",
        modelProvider: {
          api: "openai-responses",
          baseUrl: "https://api.openai.com/v1",
          requestTransportOverrides: "none",
          runtimePolicy: { compatibleIds: ["grokbot", "codex"] },
        },
        config: { agents: { defaults: { params: { store: false } } } },
        agentHarnessRuntimeOverride: "codex",
      }),
    ).toThrow("authored request params are unsupported");
    expect(supports).toHaveBeenCalledWith(
      expect.objectContaining({
        modelProvider: expect.objectContaining({ requestTransportOverrides: "present" }),
      }),
    );
  });

  it("keeps request-scoped transport overrides on the implicit GrokBot runtime", () => {
    registerAgentHarness({
      id: "codex",
      label: "Codex",
      supports: () => ({ supported: true, priority: 100 }),
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    });
    const config = {
      models: {
        providers: {
          openai: {
            api: "openai-responses",
            baseUrl: "https://api.openai.com/v1",
            models: [],
          },
        },
      },
    } satisfies OpenClawConfig;
    const modelProvider = {
      api: "openai-responses",
      baseUrl: "https://api.openai.com/v1",
      requestTransportOverrides: "present" as const,
    };

    // Without a registered codex plugin harness and no Grok Build CLI installed,
    // the implicit selection has no fallback target — the Pi agent surface is
    // entirely replaced by Grok Build CLI, so this must throw.
    mockGrokCliAvailableSync.mockReturnValue(false);
    expect(
      resolveAvailableAgentHarnessPolicy({
        provider: "openai",
        modelId: "gpt-5.5",
        modelProvider,
        config,
      }),
    ).toEqual({ runtime: "grokbot", runtimeSource: "implicit" });
    expect(() =>
      selectAgentHarness({
        provider: "openai",
        modelId: "gpt-5.5",
        modelProvider,
        config,
      }),
    ).toThrow(/Install the Grok Build CLI|register a plugin harness/);
    expect(
      selectAgentHarness({
        provider: "openai",
        modelId: "gpt-5.5",
        modelProvider: {
          api: modelProvider.api,
          baseUrl: modelProvider.baseUrl,
        },
        config,
      }).id,
    ).toBe("codex");
  });

  it("falls back only for implicitly selected Codex transport rejection", () => {
    const supports = vi.fn((ctx: Parameters<AgentHarness["supports"]>[0]) =>
      ctx.modelProvider?.requestTransportOverrides === "present"
        ? {
            supported: false as const,
            reason: "custom provider request transport",
          }
        : { supported: true as const },
    );
    registerAgentHarness({
      id: "codex",
      label: "Codex",
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    });
    const config = {
      models: {
        providers: {
          openai: {
            api: "openai-responses",
            baseUrl: "https://api.openai.com/v1",
            headers: { "x-route": "custom" },
            models: [],
          },
        },
      },
    } as OpenClawConfig;

    mockGrokCliAvailableSync.mockReturnValue(false);
    expect(
      resolveAvailableAgentHarnessPolicy({ provider: "openai", modelId: "gpt-5.5", config }),
    ).toEqual({ runtime: "grokbot", runtimeSource: "implicit" });
    expect(() =>
      selectAgentHarness({ provider: "openai", modelId: "gpt-5.5", config }),
    ).toThrow(/Install the Grok Build CLI|register a plugin harness/);
    expect(() =>
      selectAgentHarness({
        provider: "openai",
        modelId: "gpt-5.5",
        config,
        agentHarnessRuntimeOverride: "codex",
      }),
    ).toThrow("custom provider request transport");
  });

  it("falls back only for implicitly selected route-runtime incompatibility", () => {
    const supports = vi.fn((ctx: Parameters<AgentHarness["supports"]>[0]) =>
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("codex")
        ? { supported: true as const }
        : { supported: false as const, reason: "native runtime is incompatible with route" },
    );
    registerAgentHarness({
      id: "codex",
      label: "Codex",
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    });
    const modelProvider = {
      api: "openai-completions",
      baseUrl: "https://api.openai.com/v1",
      requestTransportOverrides: "none" as const,
      runtimePolicy: { compatibleIds: ["grokbot"] },
    };

    expect(selectAgentHarness({ provider: "openai", modelId: "gpt-5.5", modelProvider }).id).toBe(
      "grokbot",
    );
    expect(() =>
      selectAgentHarness({
        provider: "openai",
        modelId: "gpt-5.5",
        modelProvider,
        agentHarnessRuntimeOverride: "codex",
      }),
    ).toThrow("native runtime is incompatible with route");
  });

  it("does not infer native support for an indeterminate OpenAI route", () => {
    const supports = vi.fn((ctx: Parameters<AgentHarness["supports"]>[0]) =>
      ctx.modelProvider?.runtimePolicy
        ? { supported: true as const }
        : { supported: false as const, reason: "route compatibility is undeclared" },
    );
    registerAgentHarness({
      id: "codex",
      label: "Codex",
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    });

    expect(selectAgentHarness({ provider: "openai", modelId: "gpt-future" }).id).toBe("codex");
    expect(supports).toHaveBeenCalledWith(
      expect.objectContaining({
        modelProvider: expect.objectContaining({ runtimePolicy: undefined }),
      }),
    );
  });

  it("projects a harness-owned auth plan as a closed harness source", () => {
    const deferredRouteSupport = {
      requestTransportOverrides: "none" as const,
      runtimePolicy: { compatibleIds: ["grokbot", "codex"] },
    };
    expect(
      resolveAgentHarnessPreparedAuthSupport({
        plan: {
          providerForAuth: "openai",
          authProfileProviderForAuth: "openai",
          harnessAuthProvider: "openai",
          deferredRouteSupport,
        },
      }),
    ).toEqual({ source: "harness" });
    expect(
      resolveAgentHarnessPreparedRouteSupport({
        providerForAuth: "openai",
        authProfileProviderForAuth: "openai",
        harnessAuthProvider: "openai",
        deferredRouteSupport,
      }),
    ).toEqual(deferredRouteSupport);
    expect(
      resolveAgentHarnessPreparedRouteSupport({
        providerForAuth: "openai",
        authProfileProviderForAuth: "openai",
      }),
    ).toEqual({});
    expect(
      resolveAgentHarnessPreparedAuthSupport({
        plan: {
          providerForAuth: "openai",
          authProfileProviderForAuth: "openai",
          harnessAuthProvider: "openai",
          selectedAuthMode: "api-key",
        },
      }),
    ).toEqual({ source: "direct", mode: "api-key" });
  });

  it("keeps finalized native selection for declared deferred harness-owned auth", () => {
    const supports = vi.fn((ctx: Parameters<AgentHarness["supports"]>[0]) =>
      ctx.modelProvider?.preparedAuth?.source === "harness" &&
      ctx.modelProvider.preparedAuth.requirement === undefined &&
      ctx.modelProvider.runtimePolicy?.compatibleIds.includes("codex")
        ? { supported: true as const }
        : { supported: false as const },
    );
    registerAgentHarness({
      id: "codex",
      label: "Codex",
      supports,
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    });

    expect(
      selectAgentHarness({
        provider: "openai",
        modelId: "gpt-future",
        modelProvider: {
          requestTransportOverrides: "none",
          runtimePolicy: { compatibleIds: ["grokbot", "codex"] },
          preparedAuth: { source: "harness" },
        },
        agentHarnessRuntimeOverride: "codex",
      }).id,
    ).toBe("codex");
    expect(supports).toHaveBeenCalledWith(
      expect.objectContaining({
        modelProvider: expect.objectContaining({
          preparedAuth: { source: "harness" },
          runtimePolicy: { compatibleIds: ["grokbot", "codex"] },
        }),
      }),
    );
  });

  it("selects one harness compatible with every prepared model provider", () => {
    registerAgentHarness({
      id: "codex",
      label: "Codex",
      supports: (ctx) =>
        ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("codex")
          ? { supported: true }
          : { supported: false, reason: "prepared retry route is incompatible" },
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    });
    const compatible = {
      api: "openai-responses",
      baseUrl: "https://api.openai.com/v1",
      requestTransportOverrides: "none" as const,
      runtimePolicy: { compatibleIds: ["grokbot", "codex"] },
      preparedAuth: { source: "direct" as const, mode: "api-key", requirement: "api-key" as const },
    };
    const incompatible = {
      api: "openai-completions",
      baseUrl: "https://api.openai.com/v1",
      requestTransportOverrides: "none" as const,
      runtimePolicy: { compatibleIds: ["grokbot"] },
      preparedAuth: { source: "direct" as const, mode: "api-key", requirement: "api-key" as const },
    };
    const base = { provider: "openai", modelId: "gpt-5.5" };

    expect(
      selectAgentHarnessForPreparedModelProviders({
        ...base,
        modelProviders: [compatible, compatible],
      }).id,
    ).toBe("codex");
    expect(
      selectAgentHarnessForPreparedModelProviders({
        ...base,
        modelProviders: [compatible, incompatible],
      }).id,
    ).toThrow(/Multi-provider agent harness decisions disagree|Install the Grok Build CLI/);
  });

  it.each([
    ["explicit", { agentHarnessRuntimeOverride: "codex" }],
    ["pinned", { agentHarnessId: "codex" }],
  ] as const)("fails closed when a %s harness cannot own every prepared route", (_label, pin) => {
    registerAgentHarness({
      id: "codex",
      label: "Codex",
      supports: (ctx) =>
        ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("codex")
          ? { supported: true }
          : { supported: false, reason: "prepared retry route is incompatible" },
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
    });

    expect(() =>
      selectAgentHarnessForPreparedModelProviders({
        provider: "openai",
        modelId: "gpt-5.5",
        modelProviders: [
          {
            api: "openai-responses",
            baseUrl: "https://api.openai.com/v1",
            requestTransportOverrides: "none",
            runtimePolicy: { compatibleIds: ["grokbot", "codex"] },
          },
          {
            api: "openai-completions",
            baseUrl: "https://api.openai.com/v1",
            requestTransportOverrides: "none",
            runtimePolicy: { compatibleIds: ["grokbot"] },
          },
        ],
        ...pin,
      }),
    ).toThrow("prepared retry route is incompatible");
  });

  it.each([
    {
      label: "a finalized route with undeclared compatibility",
      modelProvider: {
        api: "openai-completions",
        baseUrl: "https://api.openai.com/v1",
      },
      expectsRuntimePolicy: false,
    },
    {
      label: "prepared auth",
      modelProvider: {
        preparedAuth: {
          source: "none" as const,
          requirement: "subscription" as const,
        },
      },
      expectsRuntimePolicy: false,
    },
  ])(
    "validates a session-pinned harness against $label",
    ({ modelProvider, expectsRuntimePolicy }) => {
      const supports = vi.fn((ctx: Parameters<AgentHarness["supports"]>[0]) => {
        const preparedAuth = ctx.modelProvider?.preparedAuth;
        const reproducible =
          ctx.modelProvider?.runtimePolicy !== undefined && preparedAuth?.source !== "none";
        return reproducible
          ? { supported: true as const }
          : {
              supported: false as const,
              reason: "native runtime cannot reproduce prepared facts",
            };
      });
      registerAgentHarness({
        id: "codex",
        label: "Codex",
        supports,
        runAttempt: vi.fn(async () => createAttemptResult("codex")),
      });

      expect(() =>
        selectAgentHarnessForPreparedModelProviders({
          provider: "openai",
          modelId: "gpt-5.5",
          modelProviders: [modelProvider],
          agentHarnessId: "codex",
        }),
      ).toThrow("native runtime cannot reproduce prepared facts");
      expect(supports).toHaveBeenCalledOnce();
      expect(Boolean(supports.mock.calls[0]?.[0].modelProvider?.runtimePolicy)).toBe(
        expectsRuntimePolicy,
      );
    },
  );

  it("honors explicit GrokBot runtime overrides when selecting a harness", async () => {
    registerSuccessfulCodexHarness();

    const harness = selectAgentHarness({
      provider: "openai",
      modelId: "gpt-5.4",
      agentHarnessRuntimeOverride: "grokbot",
    });

    expect(harness.id).toBe("grokbot");
    expect(providerOwnerMocks.resolveProviderRefOwnership).not.toHaveBeenCalled();

    const result = await runAgentHarnessAttempt({
      ...createAttemptParams(),
      provider: "openai",
      modelId: "gpt-5.4",
      agentHarnessRuntimeOverride: "grokbot",
    });
    expect(result.sessionIdUsed).toBe("grokbot");
  });

  it("throws on legacy PI runtime overrides (Pi agent harness entirely replaced by Grok Build CLI)", async () => {
    registerSuccessfulCodexHarness();

    // 'pi' is no longer a shipped alias — it passes through normalizeEmbeddedAgentRuntime
    // unchanged as a custom runtime id. With no "pi" harness registered, selectAgentHarness
    // throws "no supported harness" instead of silently dispatching to the removed Pi agent.
    expect(() =>
      selectAgentHarness({
        provider: "openai",
        modelId: "gpt-5.4",
        agentHarnessRuntimeOverride: "pi",
      }),
    ).toThrow(/No supported harness|MissingAgentHarnessError/);
  });

  it("allows per-agent model runtime policy overrides", () => {
    const config = agentModelRuntimeConfig("anthropic/sonnet-4.6", "codex", "strict");

    expect(() =>
      selectAgentHarness({
        provider: "anthropic",
        modelId: "sonnet-4.6",
        config,
        sessionKey: "agent:strict:session-1",
      }),
    ).toThrow('Requested agent harness "codex" is not registered');
    expect(selectAgentHarness({ provider: "anthropic", modelId: "sonnet-4.6", config }).id).toBe(
      "grokbot",
    );
  });

  it("auto mode throws when implicit Codex is unavailable and no Grok Build CLI is installed", () => {
    // No Grok Build CLI installed + no codex plugin harness + implicit selection
    // would have routed to grokbot. Pi agent fallback is entirely replaced —
    // auto selection must throw so the operator installs grok-cli.
    mockGrokCliAvailableSync.mockReturnValue(false);
    expect(() =>
      selectAgentHarness({ provider: "openai", modelId: "gpt-5.4" }),
    ).toThrow(/Install the Grok Build CLI|register a plugin harness/);
  });

  it.each(["default", "auto"] as const)(
    "throws from configured %s when implicit Codex is unavailable and no Grok Build CLI is installed (no Pi fallback)",
    (runtime) => {
      const config = providerRuntimeConfig("openai", runtime);
      expect(resolveAgentHarnessPolicy({ provider: "openai", modelId: "gpt-5.4", config })).toEqual(
        { runtime: "codex", runtimeSource: "implicit" },
      );
      mockGrokCliAvailableSync.mockReturnValue(false);
      expect(() =>
        selectAgentHarness({ provider: "openai", modelId: "gpt-5.4", config }),
      ).toThrow(/Install the Grok Build CLI|register a plugin harness/);

      const supports = vi.fn(() => ({ supported: false as const, reason: "unsupported route" }));
      registerAgentHarness(
        {
          id: "codex",
          label: "Codex",
          supports,
          runAttempt: vi.fn(async () => createAttemptResult("codex")),
        },
        { ownerPluginId: "codex" },
      );
      // With codex registered but grok-cli unavailable, auto mode now prefers grok-cli
      // first; when not available, throws (no Pi fallback).
      expect(() =>
        selectAgentHarness({ provider: "openai", modelId: "gpt-5.4", config }),
      ).toThrow(/Install the Grok Build CLI|register a plugin harness/);
      expect(supports).not.toHaveBeenCalled();
    },
  );

  it.each(["default", "auto"] as const)(
    "keeps a custom OpenAI route on implicit GrokBot with configured %s",
    (runtime) => {
      const supports = vi.fn(() => ({ supported: true as const, priority: 100 }));
      registerAgentHarness(
        {
          id: "codex",
          label: "Codex",
          supports,
          runAttempt: vi.fn(async () => createAttemptResult("codex")),
        },
        { ownerPluginId: "codex" },
      );
      const config = {
        models: {
          providers: {
            openai: {
              api: "openai-responses",
              baseUrl: "https://relay.example.test/v1",
              agentRuntime: { id: runtime },
              models: [],
            },
          },
        },
      } as OpenClawConfig;

      expect(resolveAgentHarnessPolicy({ provider: "openai", modelId: "gpt-5.4", config })).toEqual(
        { runtime: "grokbot", runtimeSource: "implicit" },
      );
      expect(selectAgentHarness({ provider: "openai", modelId: "gpt-5.4", config }).id).toBe(
        "grokbot",
      );
      expect(supports).not.toHaveBeenCalled();
    },
  );

  it("throws when legacy agentRuntime config references a harness with no plugin support (no Pi fallback)", () => {
    // Pi agent harness is entirely replaced by Grok Build CLI. The legacy
    // agentRuntime config field is ignored (consistent with prior behavior),
    // but auto-selection still needs a viable harness. With no plugin harness
    // registered for anthropic/sonnet-4.6 and no Grok Build CLI installed, throw
    // instead of silently falling back to the removed Pi agent surface.
    const config = {
      agents: {
        defaults: {
          agentRuntime: { id: "codex" },
        },
      },
    } as OpenClawConfig;

    expect(() =>
      selectAgentHarness({
        provider: "anthropic",
        modelId: "sonnet-4.6",
        config,
      }),
    ).toThrow(/Install the Grok Build CLI|register a plugin harness/);
  });

  it("ignores legacy agent CLI runtime aliases for OpenAI agent model runs", async () => {
    registerSuccessfulCodexHarness();
    const config: OpenClawConfig = {
      agents: {
        defaults: {
          agentRuntime: { id: "claude-cli" },
        },
      },
    };

    expect(selectAgentHarness({ provider: "openai", modelId: "gpt-5.4", config }).id).toBe("codex");

    const result = await runAgentHarnessAttempt({
      ...createAttemptParams(config),
      provider: "openai",
      modelId: "gpt-5.4",
    });
    expect(result.sessionIdUsed).toBe("codex");
    expect(agentRunAttempt).not.toHaveBeenCalled();
  });

  it("keeps an existing session GrokBot pin when provider policy forces a plugin harness", () => {
    registerFailingCodexHarness();

    expect(
      selectAgentHarness({
        provider: "codex",
        modelId: "gpt-5.4",
        agentHarnessId: "grokbot",
        config: providerRuntimeConfig("codex", "codex"),
      }).id,
    ).toBe("grokbot");
  });

  it("ignores env-forced GrokBot for OpenAI default runtime selection", () => {
    process.env.OPENCLAW_AGENT_RUNTIME = "grokbot";
    registerFailingCodexHarness();

    expect(
      selectAgentHarness({
        provider: "codex",
        modelId: "gpt-5.4",
        agentHarnessId: "codex",
      }).id,
    ).toBe("codex");
  });

  it("skips harness compaction preflight for claude-cli runtime sessions", async () => {
    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:main:main",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "anthropic",
        model: "claude-opus-4-7",
        config: agentModelRuntimeConfig("anthropic/claude-opus-4-7", "claude-cli"),
      }),
    ).resolves.toBeUndefined();
  });

  it("skips harness compaction preflight for claude-cli provider sessions", async () => {
    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:main:main",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "claude-cli",
        model: "claude-opus-4-7",
        config: providerRuntimeConfig("claude-cli", "claude-cli"),
      }),
    ).resolves.toBeUndefined();
  });

  it("keeps host auth on the built-in GrokBot compaction fallback", async () => {
    await expect(
      maybeCompactAgentHarnessSession(
        createCompactionParams({
          agentHarnessId: "grokbot",
          authProfileId: "openai:work",
          authProfileIdSource: "user",
          runtimeAuthPlan: {
            providerForAuth: "openai",
            authProfileProviderForAuth: "openai",
            forwardedAuthProfileId: "openai:work",
            forwardedAuthProfileSource: "user",
            selectedAuthMode: "api_key",
          },
        }),
      ),
    ).resolves.toBeUndefined();
  });

  it("uses the prepared custom route when selecting a compaction harness", async () => {
    const compact = registerTestCompactor({
      supports: (ctx) =>
        ctx.modelProvider?.api === OPENAI_CHATGPT_ROUTE.api &&
        ctx.modelProvider.baseUrl === OPENAI_CHATGPT_ROUTE.baseUrl
          ? { supported: true, priority: 100 }
          : { supported: false },
    });

    await expect(
      maybeCompactAgentHarnessSession(
        createCompactionParams({
          model: "gpt-5.5-custom",
          runtimeAuthPlan: {
            providerForAuth: "openai",
            authProfileProviderForAuth: "openai",
            modelRoute: {
              ...OPENAI_PLATFORM_ROUTE,
              modelId: "gpt-5.5-custom",
              baseUrl: "https://relay.example.test/v1",
            },
          },
        }),
      ),
    ).resolves.toBeUndefined();
    expect(compact).not.toHaveBeenCalled();
  });

  it("uses the concrete prepared route without replacing harness auth bootstrap", async () => {
    const compact = registerTestCompactor({
      authBootstrap: "harness",
      supports: (ctx) =>
        ctx.modelProvider?.api === OPENAI_CHATGPT_ROUTE.api &&
        ctx.modelProvider.baseUrl === OPENAI_CHATGPT_ROUTE.baseUrl
          ? { supported: true, priority: 100 }
          : { supported: false },
    });

    await expect(
      maybeCompactAgentHarnessSession(
        createCompactionParams({
          runtimeAuthPlan: {
            providerForAuth: "openai",
            authProfileProviderForAuth: "openai",
            harnessAuthProvider: "openai",
            modelRoute: OPENAI_CHATGPT_ROUTE,
          },
        }),
      ),
    ).resolves.toEqual({ ok: true, compacted: false });

    expect(compactAuthMocks.resolveModelAsync).not.toHaveBeenCalled();
    expect(compactAuthMocks.getApiKeyForModel).not.toHaveBeenCalled();
    expect(compact).toHaveBeenCalledWith(
      expect.objectContaining({
        runtimeAuthPlan: expect.objectContaining({
          modelRoute: OPENAI_CHATGPT_ROUTE,
        }),
      }),
    );
  });

  it("forwards the prepared Platform key through harness-owned compaction", async () => {
    const compact = registerTestCompactor({ authBootstrap: "harness" });

    await expect(
      maybeCompactAgentHarnessSession(
        createCompactionParams({
          resolvedApiKey: "test-key",
          runtimeAuthPlan: {
            providerForAuth: "openai",
            authProfileProviderForAuth: "openai",
            harnessAuthProvider: "openai",
            selectedAuthMode: "api-key",
            modelRoute: OPENAI_PLATFORM_ROUTE,
          },
        }),
      ),
    ).resolves.toEqual({ ok: true, compacted: false });

    expect(compact).toHaveBeenCalledWith(
      expect.objectContaining({
        resolvedApiKey: "test-key",
        runtimeAuthPlan: expect.objectContaining({ modelRoute: OPENAI_PLATFORM_ROUTE }),
      }),
    );
  });

  it("keeps pinned plugin compaction when the outer provider no longer matches", async () => {
    const compact = vi.fn<NonNullable<AgentHarness["compact"]>>(async () => ({
      ok: true,
      compacted: false,
    }));
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: (ctx) =>
          ctx.provider === "openai" ? { supported: true, priority: 100 } : { supported: false },
        runAttempt: vi.fn(async () => createAttemptResult("codex")),
        compact,
      },
      { ownerPluginId: "codex" },
    );

    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:main:main",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "ollama",
        model: "llama3.3",
        agentHarnessId: "codex",
      }),
    ).resolves.toEqual({ ok: true, compacted: false });
    expect(compact).toHaveBeenCalledOnce();
  });

  it("fails closed when a pinned compaction harness is unavailable", async () => {
    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:main:main",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "anthropic",
        model: "claude-opus-4-6",
        agentHarnessId: "codex",
      }),
    ).rejects.toThrow('Requested agent harness "codex" is not registered');
  });

  it("honors selected plugin harness pins during compaction preflight", async () => {
    const compact = vi.fn<NonNullable<AgentHarness["compact"]>>(async () => ({
      ok: true,
      compacted: false,
    }));
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: (ctx) =>
          ctx.provider === "openai" ? { supported: true, priority: 100 } : { supported: false },
        runAttempt: vi.fn(async () => createAttemptResult("codex")),
        compact,
      },
      { ownerPluginId: "codex" },
    );
    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:main:main",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "openai",
        model: "gpt-5.5",
        authProfileId: "main-profile",
        resolvedApiKey: "test-key",
        agentHarnessId: "codex",
        config: {
          agents: {
            list: [{ id: "main", default: true, agentDir: "/tmp/main-agent" }],
            defaults: {
              models: {
                "openai/gpt-5.5": { agentRuntime: { id: "grokbot" } },
              },
            },
          },
        } as OpenClawConfig,
      }),
    ).resolves.toEqual({ ok: true, compacted: false });
    expect(compact).toHaveBeenCalledTimes(1);
    expect(compact.mock.calls[0]?.[0]).toMatchObject({
      agentDir: "/tmp/main-agent",
      agentId: "main",
      resolvedApiKey: "test-key",
      runtimeModel: {
        id: "gpt-5.5",
        provider: "openai",
      },
    });
  });

  it("routes internal post-context-engine compaction through the harness private capability", async () => {
    const compact = vi.fn<NonNullable<AgentHarness["compact"]>>(async () => ({
      ok: true,
      compacted: true,
    }));
    const compactAfterContextEngine = vi.fn(
      async (_params: AgentHarnessCompactParams): Promise<AgentHarnessCompactResult> => ({
        ok: true,
        compacted: false,
        result: {
          summary: "native follow-up queued",
          firstKeptEntryId: "entry-1",
          tokensBefore: 10,
          details: { request: "after_context_engine" },
        },
      }),
    );
    const harness: AgentHarness & {
      compactAfterContextEngine(
        params: AgentHarnessCompactParams,
      ): Promise<AgentHarnessCompactResult | undefined>;
    } = {
      id: "codex",
      label: "Codex",
      supports: (ctx) =>
        ctx.provider === "openai" ? { supported: true, priority: 100 } : { supported: false },
      runAttempt: vi.fn(async () => createAttemptResult("codex")),
      compact,
      compactAfterContextEngine,
    };
    registerAgentHarness(harness, { ownerPluginId: "codex" });

    await expect(
      maybeCompactAgentHarnessSession(
        {
          sessionId: "session-1",
          sessionKey: "agent:main:main",
          sessionFile: "/tmp/session.jsonl",
          workspaceDir: "/tmp/workspace",
          provider: "openai",
          model: "gpt-5.5",
          agentHarnessId: "codex",
        },
        { nativeCompactionRequest: "after_context_engine" },
      ),
    ).resolves.toEqual({
      ok: true,
      compacted: false,
      result: {
        summary: "native follow-up queued",
        firstKeptEntryId: "entry-1",
        tokensBefore: 10,
        details: { request: "after_context_engine" },
      },
    });
    expect(compact).not.toHaveBeenCalled();
    expect(compactAfterContextEngine).toHaveBeenCalledTimes(1);
  });

  it("skips internal post-context-engine compaction when the harness lacks the private capability", async () => {
    const compact = vi.fn<NonNullable<AgentHarness["compact"]>>(async () => ({
      ok: true,
      compacted: true,
    }));
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: (ctx) =>
          ctx.provider === "openai" ? { supported: true, priority: 100 } : { supported: false },
        runAttempt: vi.fn(async () => createAttemptResult("codex")),
        compact,
      },
      { ownerPluginId: "codex" },
    );

    await expect(
      maybeCompactAgentHarnessSession(
        {
          sessionId: "session-1",
          sessionKey: "agent:main:main",
          sessionFile: "/tmp/session.jsonl",
          workspaceDir: "/tmp/workspace",
          provider: "openai",
          model: "gpt-5.5",
          agentHarnessId: "codex",
        },
        { nativeCompactionRequest: "after_context_engine" },
      ),
    ).resolves.toBeUndefined();
    expect(compact).not.toHaveBeenCalled();
  });

  it("keeps compaction recoverable when auth profile lookup fails", async () => {
    compactAuthMocks.getApiKeyForModel.mockRejectedValue(new Error("missing auth profile"));
    const compact = vi.fn<NonNullable<AgentHarness["compact"]>>(async () => ({
      ok: true,
      compacted: false,
    }));
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: (ctx) =>
          ctx.provider === "openai" ? { supported: true, priority: 100 } : { supported: false },
        runAttempt: vi.fn(async () => createAttemptResult("codex")),
        compact,
      },
      { ownerPluginId: "codex" },
    );

    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:main:main",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "openai",
        model: "gpt-5.5",
        authProfileId: "deleted-profile",
        agentHarnessId: "codex",
        config: agentModelRuntimeConfig("openai/gpt-5.5", "grokbot"),
      }),
    ).resolves.toEqual({ ok: true, compacted: false });
    expect(compact).toHaveBeenCalledTimes(1);
    expect(compact.mock.calls[0]?.[0]).not.toHaveProperty("resolvedApiKey");
    expect(compactAuthMocks.resolveModelAsync).toHaveBeenCalledWith(
      "openai",
      "gpt-5.5",
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        authProfileId: "deleted-profile",
        workspaceDir: "/tmp/workspace",
      }),
    );
  });

  it("preserves resolved compaction credentials when model lookup fails", async () => {
    compactAuthMocks.resolveModelAsync.mockRejectedValue(new Error("model lookup unavailable"));
    const compact = vi.fn<NonNullable<AgentHarness["compact"]>>(async () => ({
      ok: true,
      compacted: false,
    }));
    registerAgentHarness(
      {
        id: "copilot",
        label: "Copilot",
        supports: (ctx) =>
          ctx.provider === "local-proxy"
            ? { supported: true, priority: 100 }
            : { supported: false },
        runAttempt: vi.fn(async () => createAttemptResult("copilot")),
        compact,
      },
      { ownerPluginId: "copilot" },
    );

    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:main:main",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "local-proxy",
        model: "proxy-model",
        resolvedApiKey: "already-resolved",
        agentHarnessId: "copilot",
      }),
    ).resolves.toEqual({ ok: true, compacted: false });

    expect(compactAuthMocks.getApiKeyForModel).not.toHaveBeenCalled();
    expect(compact).toHaveBeenCalledWith(
      expect.objectContaining({
        resolvedApiKey: "already-resolved",
      }),
    );
  });

  it("fails closed when route preparation cannot protect harness-owned compaction auth", async () => {
    compactAuthMocks.resolveModelAsync.mockRejectedValue(new Error("model lookup unavailable"));
    const compact = registerTestCompactor({ authBootstrap: "harness" });

    await expect(
      maybeCompactAgentHarnessSession(
        createCompactionParams({
          agentHarnessId: "codex",
          resolvedApiKey: "must-not-reach-ambient-auth",
        }),
      ),
    ).rejects.toThrow("refusing harness-owned ambient auth");
    expect(compact).not.toHaveBeenCalled();
  });

  it("passes runtime model and default credentials to compaction when auth profile id is absent", async () => {
    compactAuthMocks.resolveModelAsync.mockResolvedValue({
      model: {
        id: "proxy-model",
        provider: "local-proxy",
        api: "openai-responses",
        baseUrl: "https://proxy.example/v1",
      },
    });
    const compact = vi.fn<NonNullable<AgentHarness["compact"]>>(async () => ({
      ok: true,
      compacted: false,
    }));
    registerAgentHarness(
      {
        id: "copilot",
        label: "Copilot",
        supports: (ctx) =>
          ctx.provider === "local-proxy"
            ? { supported: true, priority: 100 }
            : { supported: false },
        runAttempt: vi.fn(async () => createAttemptResult("copilot")),
        compact,
      },
      { ownerPluginId: "copilot" },
    );

    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:main:main",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "local-proxy",
        model: "proxy-model",
        agentHarnessId: "copilot",
      }),
    ).resolves.toEqual({ ok: true, compacted: false });

    expect(compactAuthMocks.resolveModelAsync).toHaveBeenCalledWith(
      "local-proxy",
      "proxy-model",
      expect.any(String),
      undefined,
      expect.objectContaining({
        authProfileId: undefined,
        workspaceDir: "/tmp/workspace",
      }),
    );
    expect(compactAuthMocks.getApiKeyForModel).toHaveBeenCalledWith(
      expect.objectContaining({
        agentDir: expect.any(String),
        model: expect.objectContaining({
          baseUrl: "https://proxy.example/v1",
          id: "proxy-model",
        }),
        workspaceDir: "/tmp/workspace",
      }),
    );
    expect(compact).toHaveBeenCalledWith(
      expect.objectContaining({
        resolvedApiKey: "test-key",
        runtimeModel: expect.objectContaining({
          baseUrl: "https://proxy.example/v1",
          id: "proxy-model",
        }),
      }),
    );
  });

  it("does not compact a selected plugin harness through GrokBot when the plugin has no compactor", async () => {
    registerFailingCodexHarness();

    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:main:main",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "codex",
        model: "gpt-5.5",
        agentHarnessId: "codex",
      }),
    ).resolves.toEqual({
      ok: false,
      compacted: false,
      reason: 'Agent harness "codex" does not support compaction.',
      failure: { reason: "unsupported_harness_compaction" },
    });
  });

  it("uses agent-scoped runtime policy during compaction preflight", async () => {
    const compact = vi.fn<NonNullable<AgentHarness["compact"]>>(async () => ({
      ok: true,
      compacted: false,
    }));
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: (ctx) =>
          ctx.provider === "openai" ? { supported: true, priority: 100 } : { supported: false },
        runAttempt: vi.fn(async () => createAttemptResult("codex")),
        compact,
      },
      { ownerPluginId: "codex" },
    );

    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:strict:main",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "openai",
        model: "gpt-5.5",
        agentId: "strict",
        config: agentModelRuntimeConfig("openai/gpt-5.5", "codex", "strict"),
      }),
    ).resolves.toEqual({ ok: true, compacted: false });
    expect(compact).toHaveBeenCalledTimes(1);
  });

  it("uses sandbox session key for compaction preflight runtime policy", async () => {
    const compact = vi.fn<NonNullable<AgentHarness["compact"]>>(async () => ({
      ok: true,
      compacted: false,
    }));
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: (ctx) =>
          ctx.provider === "openai" ? { supported: true, priority: 100 } : { supported: false },
        runAttempt: vi.fn(async () => createAttemptResult("codex")),
        compact,
      },
      { ownerPluginId: "codex" },
    );

    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:main:main",
        sandboxSessionKey: "agent:strict:main",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "openai",
        model: "gpt-5.5",
        agentId: "main",
        config: agentModelRuntimeConfig("openai/gpt-5.5", "codex", "strict"),
      }),
    ).resolves.toEqual({ ok: true, compacted: false });
    expect(compact).toHaveBeenCalledTimes(1);
    expect(compact.mock.calls[0]?.[0]).toMatchObject({ agentId: "main" });
  });

  it("keeps explicit agent id for non-agent sandbox policy keys during compaction preflight", async () => {
    const compact = vi.fn<NonNullable<AgentHarness["compact"]>>(async () => ({
      ok: true,
      compacted: false,
    }));
    registerAgentHarness(
      {
        id: "codex",
        label: "Codex",
        supports: (ctx) =>
          ctx.provider === "openai" ? { supported: true, priority: 100 } : { supported: false },
        runAttempt: vi.fn(async () => createAttemptResult("codex")),
        compact,
      },
      { ownerPluginId: "codex" },
    );

    await expect(
      maybeCompactAgentHarnessSession({
        sessionId: "session-1",
        sessionKey: "agent:main:main",
        sandboxSessionKey: "global",
        sessionFile: "/tmp/session.jsonl",
        workspaceDir: "/tmp/workspace",
        provider: "openai",
        model: "gpt-5.5",
        agentId: "strict",
        config: agentModelRuntimeConfig("openai/gpt-5.5", "codex", "strict"),
      }),
    ).resolves.toEqual({ ok: true, compacted: false });
    expect(compact).toHaveBeenCalledTimes(1);
  });

  it.each([
    { provider: "anthropic", modelId: "sonnet-4.6", alias: "claude-cli" },
    { provider: "google", modelId: "gemini-3-pro-preview", alias: "google-gemini-cli" },
  ])(
    "returns GrokBot for explicit CLI runtime alias $alias on $provider instead of throwing MissingAgentHarnessError",
    ({ provider, modelId, alias }) => {
      expect(
        selectAgentHarness({
          provider,
          modelId,
          agentHarnessRuntimeOverride: alias,
        }).id,
      ).toBe("grokbot");
    },
  );

  it("still throws MissingAgentHarnessError for an explicit configured cliBackends id", () => {
    const config = {
      agents: {
        defaults: {
          cliBackends: {
            "my-custom-cli": { command: "echo" },
          },
        },
      },
    } as OpenClawConfig;

    expect(() =>
      selectAgentHarness({
        provider: "anthropic",
        modelId: "sonnet-4.6",
        agentHarnessRuntimeOverride: "my-custom-cli",
        config,
      }),
    ).toThrow('Requested agent harness "my-custom-cli" is not registered');
  });

  it("still throws MissingAgentHarnessError for an explicit non-CLI unknown runtime", () => {
    expect(() =>
      selectAgentHarness({
        provider: "anthropic",
        modelId: "sonnet-4.6",
        agentHarnessRuntimeOverride: "clade-cli",
      }),
    ).toThrow('Requested agent harness "clade-cli" is not registered');
  });

  it("still throws MissingAgentHarnessError for an explicit CLI alias owned by another provider", () => {
    expect(() =>
      selectAgentHarness({
        provider: "anthropic",
        modelId: "sonnet-4.6",
        agentHarnessRuntimeOverride: "google-gemini-cli",
      }),
    ).toThrow('Requested agent harness "google-gemini-cli" is not registered');
  });

  it("auto mode prefers grok-cli (priority 30) over embedded grokbot (priority 0)", () => {
    // Toggle grokCliAvailableSync to return true so grok-cli harness reports supported.
    vi.mocked(mockGrokCliAvailableSync).mockReturnValue(true);
    const harness = selectAgentHarness({
      provider: "xai",
      modelId: "grok-3",
    });
    expect(harness.id).toBe("grok-cli");
  });

  it("auto mode throws when no Grok Build CLI or plugin harness is available (no Pi fallback)", () => {
    // Pi agent SDK is entirely replaced by Grok Build CLI — auto selection must
    // never silently dispatch to the removed Pi agent harness. If neither
    // grok-cli nor any registered plugin harness supports the request, fail loud
    // so the operator can install grok-cli (curl -fsSL https://x.ai/cli/install.sh | bash)
    // or register a plugin harness, instead of the call silently succeeding.
    expect(() =>
      selectAgentHarness({
        provider: "xai",
        modelId: "grok-3",
      }),
    ).toThrow(/Install the Grok Build CLI|register a plugin harness/);
  });
});
/* oxlint-disable max-lines -- TODO: split this grandfathered oversized file. */
