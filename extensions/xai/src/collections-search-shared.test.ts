// Xai tests cover collections search shared plugin behavior.
import { describe, expect, it } from "vitest";
import { XAI_DEFAULT_MODEL_ID } from "../model-definitions.js";
import {
  buildXaiCollectionsSearchPayload,
  resolveXaiCollectionsSearchEndpoint,
  resolveXaiCollectionsSearchIds,
  resolveXaiCollectionsSearchInlineCitations,
  resolveXaiCollectionsSearchMaxTurns,
  resolveXaiCollectionsSearchModel,
  XAI_DEFAULT_COLLECTIONS_SEARCH_MODEL,
} from "./collections-search-shared.js";

describe("xai collections search helpers", () => {
  it("uses the default Grok model when config does not override", () => {
    expect(XAI_DEFAULT_COLLECTIONS_SEARCH_MODEL).toBe(XAI_DEFAULT_MODEL_ID);
    expect(resolveXaiCollectionsSearchModel({})).toBe(XAI_DEFAULT_MODEL_ID);
    expect(resolveXaiCollectionsSearchModel(undefined)).toBe(XAI_DEFAULT_MODEL_ID);
  });

  it("normalizes an override model id and rejects whitespace-only", () => {
    expect(resolveXaiCollectionsSearchModel({ model: "  grok-4.5  " })).toBe("grok-4.5");
    expect(resolveXaiCollectionsSearchModel({ model: "   " })).toBe(XAI_DEFAULT_MODEL_ID);
  });

  it("builds the Responses-API endpoint from baseUrl with /responses suffix", () => {
    expect(resolveXaiCollectionsSearchEndpoint({ baseUrl: "https://api.x.ai/v1/" })).toBe(
      "https://api.x.ai/v1/responses",
    );
    expect(resolveXaiCollectionsSearchEndpoint({})).toBe("https://api.x.ai/v1/responses");
    expect(resolveXaiCollectionsSearchEndpoint(undefined)).toBe(
      "https://api.x.ai/v1/responses",
    );
  });

  it("defaults inline citations to false and only flips true on explicit opt-in", () => {
    expect(resolveXaiCollectionsSearchInlineCitations({})).toBe(false);
    expect(resolveXaiCollectionsSearchInlineCitations({ inlineCitations: true })).toBe(true);
    expect(resolveXaiCollectionsSearchInlineCitations({ inlineCitations: "yes" as never })).toBe(
      false,
    );
  });

  it("returns positive-integer maxTurns and ignores non-positive values", () => {
    expect(resolveXaiCollectionsSearchMaxTurns({ maxTurns: 4 })).toBe(4);
    expect(resolveXaiCollectionsSearchMaxTurns({ maxTurns: 0 })).toBeUndefined();
    expect(resolveXaiCollectionsSearchMaxTurns({ maxTurns: -1 })).toBeUndefined();
    expect(resolveXaiCollectionsSearchMaxTurns({ maxTurns: 2.5 })).toBe(2);
    expect(resolveXaiCollectionsSearchMaxTurns({ maxTurns: "5" as never })).toBeUndefined();
    expect(resolveXaiCollectionsSearchMaxTurns({})).toBeUndefined();
  });

  it("filters collectionIds to non-empty trimmed strings and drops the empty array", () => {
    expect(
      resolveXaiCollectionsSearchIds({
        collectionIds: ["col-1", "", "  ", "col-2", 42 as never],
      }),
    ).toEqual(["col-1", "col-2"]);
    expect(resolveXaiCollectionsSearchIds({ collectionIds: [] })).toBeUndefined();
    expect(resolveXaiCollectionsSearchIds({ collectionIds: ["", "  "] })).toBeUndefined();
    expect(resolveXaiCollectionsSearchIds({})).toBeUndefined();
    expect(resolveXaiCollectionsSearchIds(undefined)).toBeUndefined();
  });

  it("builds the GrokBot-shaped payload from a successful collections-search response", () => {
    const payload = buildXaiCollectionsSearchPayload({
      query: "What does the Q3 earnings call say about margins?",
      model: XAI_DEFAULT_MODEL_ID,
      tookMs: 432,
      content: "Margins expanded 120bps in Q3 driven by...",
      citations: ["https://example.com/ir/q3"],
      inlineCitations: [
        { type: "citation", text: "expanded 120bps", start: 12, end: 24, url: "https://example.com/ir/q3" },
      ],
      options: {
        query: "What does the Q3 earnings call say about margins?",
        collectionIds: ["ir-2025"],
      },
    });

    expect(payload).toEqual({
      query: "What does the Q3 earnings call say about margins?",
      provider: "xai",
      model: XAI_DEFAULT_MODEL_ID,
      tookMs: 432,
      externalContent: {
        untrusted: true,
        source: "collections_search",
        provider: "xai",
        wrapped: true,
      },
      content: expect.stringContaining("Margins expanded 120bps"),
      citations: ["https://example.com/ir/q3"],
      inlineCitations: [
        { type: "citation", text: "expanded 120bps", start: 12, end: 24, url: "https://example.com/ir/q3" },
      ],
      collectionIds: ["ir-2025"],
    });
  });

  it("omits collectionIds when the caller did not restrict to a specific collection", () => {
    const payload = buildXaiCollectionsSearchPayload({
      query: "anything",
      model: XAI_DEFAULT_MODEL_ID,
      tookMs: 10,
      content: "answer",
      citations: [],
    });
    expect(payload).not.toHaveProperty("collectionIds");
  });
});
