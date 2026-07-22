// Compatibility coverage for embedded runner barrel exports and runtime ids.
import { describe, expect, it } from "vitest";
import { normalizeEmbeddedAgentRuntime } from "../agent-runtime-id.js";
import * as embeddedAgentRunner from "../embedded-agent-runner.js";
import * as embeddedAgent from "../embedded-agent.js";

describe("embedded runner compatibility aliases", () => {
  it("keeps the embedded-agent barrel bound to the runner implementation", () => {
    // Shipped imports still reach the runner through the embedded-agent barrel;
    // keep these aliases exact so consumers do not fork stateful implementations.
    expect(embeddedAgent.runEmbeddedAgent).toBe(embeddedAgentRunner.runEmbeddedAgent);
    expect(embeddedAgent.compactEmbeddedAgentSession).toBe(
      embeddedAgentRunner.compactEmbeddedAgentSession,
    );
    expect(embeddedAgent.abortEmbeddedAgentRun).toBe(embeddedAgentRunner.abortEmbeddedAgentRun);
  });

  it("normalizes shipped runtime aliases", () => {
    // These aliases appear in persisted/runtime-facing config and must resolve
    // before model/provider dispatch observes the runtime id. Note: "pi" was
    // removed entirely in the Pi→Grok Build CLI replacement — it is no longer a
    // shipped alias and now passes through unchanged (treated as a custom runtime).
    expect(normalizeEmbeddedAgentRuntime("grokbot")).toBe("grokbot");
    expect(normalizeEmbeddedAgentRuntime("codex-app-server")).toBe("codex");
  });

  it("does not rewrite custom runtime ids (including the removed pi alias)", () => {
    // Pi is entirely replaced by Grok Build CLI; the old "pi" string is no longer
    // a special alias and now passes through as a custom runtime id (which would
    // later fail to register a harness, since no "pi" harness exists anymore).
    expect(normalizeEmbeddedAgentRuntime("custom-harness")).toBe("custom-harness");
    expect(normalizeEmbeddedAgentRuntime("pi")).toBe("pi");
  });

});
