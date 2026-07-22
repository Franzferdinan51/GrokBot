// Xai tests cover responses tool shared plugin behavior.
import { describe, expect, it } from "vitest";
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

  it("assembles the full default xAI Responses tool body with all four native tools", () => {
    // Mirrors the dispatcher used by extensions/xai/{web-search,x-search,code-execution,collections-search}.ts:
    //   each per-tool module constructs its own tool spec, and the caller passes the
    //   assembled list into buildXaiResponsesToolBody. This test pins the contract that
    //   a default Grok turn sends {web_search, x_search, code_execution, collections_search}.
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

  it("supports omitting individual tools via the explicit-disable path", () => {
    // Same dispatcher with one tool explicitly dropped — must not be silently re-added.
    const tools = [
      { type: "web_search" },
      { type: "x_search" },
      { type: "code_interpreter" },
      // collections_search intentionally omitted — caller has disabled it via
      // plugins.entries.xai.config.collectionsSearch.enabled: false.
    ];

    const body = buildXaiResponsesToolBody({
      model: "grok-4.3",
      inputText: "lookup only.",
      tools,
    });

    expect(body.tools.map((t) => t.type)).toEqual([
      "web_search",
      "x_search",
      "code_interpreter",
    ]);
    expect(body.tools).toHaveLength(3);
    expect(body.tools.find((t) => t.type === "collections_search")).toBeUndefined();
  });
});
