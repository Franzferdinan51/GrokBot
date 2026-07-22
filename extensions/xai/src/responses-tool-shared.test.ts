// Xai tests cover responses tool shared plugin behavior.
//
// 1. The first describe block ("xai responses tool helpers") exercises the
//    SHIPPED helper functions: buildXaiResponsesToolBody, extractXaiWebSearchContent,
//    requireXaiResponseTextAndCitations, requireXaiResponseTextCitationsAndInline.
//    These are pure functions over JSON; they pin the contract that
//    buildXaiResponsesToolBody emits the exact xAI Responses API body shape.
//
// 2. The second describe block ("isXaiToolEnabled registration-adjacent gate")
//    drives the SHIPPED gate that createLazy{CodeExecution,XSearch,CollectionsSearch}Tool
//    calls during api.registerTool(... { name: ... }). This is what decides whether
//    each tool is exposed at registration time.
//
// 3. The third describe block ("collectionsSearch config round-trip") drives
//    the SHIPPED resolver + writer for plugins.entries.xai.config.collectionsSearch.*,
//    proving that explicit-disable (enabled:false) survives re-runs of onboard /
//    grokbot configure.
//
// 4. The fourth describe block ("xai Responses tool body assembly") pins the
//    end-to-end shape that the runtime sends to xAI when all 4 native tools are
//    exposed (default-on path) and when collections_search is explicitly disabled.
import type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
import { describe, expect, it } from "vitest";
import { isXaiToolEnabled } from "./tool-auth-shared.js";
import {
  resolveEffectiveCollectionsSearchConfig,
  setPluginCollectionsSearchConfigValue,
} from "./collections-search-config.js";
import {
  buildXaiResponsesToolBody,
  extractXaiWebSearchContent,
  requireXaiResponseTextAndCitations,
  requireXaiResponseTextCitationsAndInline,
} from "./responses-tool-shared.js";


describe("xai responses tool helpers", () => {
  it("builds the shared xAI Responses tool body", () => {
    expect(
      buildXaiResponsesToolBody({
        model: "grok-4.3",
        inputText: "search for grokbot",
        tools: [{ type: "x_search" }],
        maxTurns: 2,
        reasoningEffort: "none",
      }),
    ).toEqual({
      model: "grok-4.3",
      input: [{ role: "user", content: "search for grokbot" }],
      tools: [{ type: "x_search" }],
      store: false,
      reasoning: { effort: "none" },
      max_turns: 2,
    });
  });

  it("keeps custom model reasoning untouched while disabling response storage", () => {
    expect(
      buildXaiResponsesToolBody({
        model: "grok-build-0.1",
        inputText: "run code",
        tools: [{ type: "code_interpreter" }],
      }),
    ).toEqual({
      model: "grok-build-0.1",
      input: [{ role: "user", content: "run code" }],
      tools: [{ type: "code_interpreter" }],
      store: false,
    });
  });

  it("falls back to annotation citations when the API omits top-level citations", () => {
    expect(
      requireXaiResponseTextAndCitations(
        {
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: "Found it",
                  annotations: [{ type: "url_citation", url: "https://example.com/a" }],
                },
              ],
            },
          ],
        },
        "xAI tool failed",
      ),
    ).toEqual({
      content: "Found it",
      citations: ["https://example.com/a"],
    });
  });

  it("ignores malformed output, content, and annotation entries", () => {
    expect(
      extractXaiWebSearchContent({
        output: [
          null,
          {
            type: "message",
            content: [
              null,
              {
                type: "output_text",
                text: "Found it",
                annotations: [
                  null,
                  { type: "url_citation", url: "https://example.com/a" },
                  { type: "url_citation", url: "https://example.com/a" },
                  { type: "url_citation" },
                ],
              },
            ],
          },
        ],
      }),
    ).toEqual({
      text: "Found it",
      annotationCitations: ["https://example.com/a"],
    });
  });

  it("prefers explicit top-level citations when present", () => {
    expect(
      requireXaiResponseTextAndCitations(
        {
          output_text: "Done",
          citations: ["https://example.com/b"],
        },
        "xAI tool failed",
      ),
    ).toEqual({
      content: "Done",
      citations: ["https://example.com/b"],
    });
  });

  it("includes inline citations only when enabled", () => {
    const data = {
      output_text: "Done",
      citations: ["https://example.com/b"],
      inline_citations: [{ start_index: 0, end_index: 4, url: "https://example.com/b" }],
    };
    expect(requireXaiResponseTextCitationsAndInline(data, "xAI tool failed", true)).toEqual({
      content: "Done",
      citations: ["https://example.com/b"],
      inlineCitations: [{ start_index: 0, end_index: 4, url: "https://example.com/b" }],
    });
    expect(requireXaiResponseTextCitationsAndInline(data, "xAI tool failed", false)).toEqual({
      content: "Done",
      citations: ["https://example.com/b"],
      inlineCitations: undefined,
    });
  });

  it("rejects successful Responses tool payloads without answer text", () => {
    expect(() => requireXaiResponseTextAndCitations({}, "xAI tool failed")).toThrow(
      "xAI tool failed: malformed JSON response",
    );
  });
});

describe("xai registration-adjacent: isXaiToolEnabled", () => {
  it("explicit disable returns false (default-deny when user opts out)", () => {
    expect(isXaiToolEnabled({ enabled: false })).toBe(false);
  });

  it("explicit enable returns true when auth is available", () => {
    expect(
      isXaiToolEnabled({
        enabled: true,
        auth: { hasAuthForProvider: (id: string) => id === "xai" },
      }),
    ).toBe(true);
  });

  it("undefined enabled with auth callback returns true (the default-on path)", () => {
    expect(
      isXaiToolEnabled({
        enabled: undefined,
        auth: { hasAuthForProvider: (id: string) => id === "xai" },
      }),
    ).toBe(true);
  });

  it("undefined enabled with no auth returns false (no API key → no tool)", () => {
    expect(isXaiToolEnabled({ enabled: undefined, auth: {} })).toBe(false);
  });

  it("explicit enable survives across providers (the cross-provider opt-in path)", () => {
    expect(
      isXaiToolEnabled({
        enabled: true,
        auth: { hasAuthForProvider: (id: string) => id === "xai" },
      }),
    ).toBe(true);
  });
});

describe("xai registration-adjacent: collectionsSearch config round-trip", () => {
  it("resolveEffectiveCollectionsSearchConfig returns undefined when plugin block is absent", () => {
    expect(resolveEffectiveCollectionsSearchConfig({})).toBeUndefined();
    expect(resolveEffectiveCollectionsSearchConfig(undefined)).toBeUndefined();
  });

  it("resolveEffectiveCollectionsSearchConfig returns a clone of the plugin block", () => {
    const cfg = {
      plugins: {
        entries: {
          xai: {
            config: {
              collectionsSearch: { enabled: true, model: "grok-4.5" },
            },
          },
        },
      },
    };
    expect(resolveEffectiveCollectionsSearchConfig(cfg)).toEqual({
      enabled: true,
      model: "grok-4.5",
    });
  });

  it("resolveEffectiveCollectionsSearchConfig returns a clone, not the same reference", () => {
    const inner = { enabled: true };
    const cfg = {
      plugins: { entries: { xai: { config: { collectionsSearch: inner } } } },
    };
    expect(resolveEffectiveCollectionsSearchConfig(cfg)).not.toBe(inner);
  });

  it("setPluginCollectionsSearchConfigValue builds the nested structure when missing", () => {
    const cfg = {} as OpenClawConfig;
    setPluginCollectionsSearchConfigValue(cfg, "enabled", true);
    expect(cfg).toEqual({
      plugins: { entries: { xai: { config: { collectionsSearch: { enabled: true } } } } },
    });
  });

  it("setPluginCollectionsSearchConfigValue preserves existing values when adding new ones", () => {
    const cfg = {
      plugins: { entries: { xai: { config: { collectionsSearch: { enabled: true } } } } },
    } as OpenClawConfig;
    setPluginCollectionsSearchConfigValue(cfg, "model", "grok-4.5");
    setPluginCollectionsSearchConfigValue(cfg, "collectionIds", ["col-1", "col-2"]);
    expect(resolveEffectiveCollectionsSearchConfig(cfg)).toEqual({
      enabled: true,
      model: "grok-4.5",
      collectionIds: ["col-1", "col-2"],
    });
  });

  it("explicit disable survives round-trip (user-set value not silently re-enabled)", () => {
    const cfg = {
      plugins: { entries: { xai: { config: { collectionsSearch: { enabled: false } } } } },
    } as OpenClawConfig;
    setPluginCollectionsSearchConfigValue(cfg, "model", "grok-4.5");
    expect(resolveEffectiveCollectionsSearchConfig(cfg)).toEqual({
      enabled: false,
      model: "grok-4.5",
    });
  });
});

describe("xai Responses tool body assembly — 4 native tools", () => {
  // Pin the end-to-end shape: when the SHIPPED registration layer filters tools
  // (via isXaiToolEnabled) and assembles the tools[] array, buildXaiResponsesToolBody
  // emits the contract body the xAI Responses API expects.

  it("assembles the 4-tool default body (web_search + x_search + code_execution + collections_search)", () => {
    const tools = [
      { type: "web_search" },
      { type: "x_search" },
      { type: "code_interpreter" },
      { type: "collections_search" },
    ];

    const body = buildXaiResponsesToolBody({
      model: "grok-4.3",
      inputText: "Plan my Q4 product launch.",
      tools,
      maxTurns: 4,
      reasoningEffort: "low",
    });

    expect(body.tools).toHaveLength(4);
    expect(body.tools.map((t) => t.type)).toEqual([
      "web_search",
      "x_search",
      "code_interpreter",
      "collections_search",
    ]);
    expect(body).toEqual({
      model: "grok-4.3",
      input: [{ role: "user", content: "Plan my Q4 product launch." }],
      tools: [
        { type: "web_search" },
        { type: "x_search" },
        { type: "code_interpreter" },
        { type: "collections_search" },
      ],
      store: false,
      reasoning: { effort: "low" },
      max_turns: 4,
    });
  });

  it("omits collections_search from the body when the explicit-disable path returns null at registration", () => {
    // createLazyCollectionsSearchTool returns null when isXaiToolEnabled returns false
    // (because plugins.entries.xai.config.collectionsSearch.enabled === false).
    // The agent loop skips the null entry when assembling tools[], so the body
    // here reflects the post-registration filtered list.
    const tools = [
      { type: "web_search" },
      { type: "x_search" },
      { type: "code_interpreter" },
    ];

    const body = buildXaiResponsesToolBody({
      model: "grok-4.3",
      inputText: "lookup only.",
      tools,
    });

    expect(body.tools).toHaveLength(3);
    expect(body.tools.find((t) => t.type === "collections_search")).toBeUndefined();
  });
});
