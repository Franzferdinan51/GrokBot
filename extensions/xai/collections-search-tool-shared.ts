// Xai plugin module implements collections search tool shared behavior.
import type { AgentToolResult } from "grokbot/plugin-sdk/agent-core";
import { Type } from "typebox";

export const COLLECTIONS_SEARCH_ID_LIMIT = 50;

export function buildMissingCollectionsSearchApiKeyPayload() {
  return {
    error: "missing_xai_api_key",
    message:
      "collections_search needs xAI credentials. Run `grokbot onboard --auth-choice xai-oauth` to sign in with Grok, run `grokbot onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
    docs: "https://docs.grokbot.ai/tools/collections-search",
  };
}

export function createCollectionsSearchToolDefinition(
  execute: (
    toolCallId: string,
    args: Record<string, unknown>,
  ) => Promise<AgentToolResult<unknown>>,
) {
  return {
    label: "Collections Search",
    name: "collections_search",
    description:
      "Search xAI-hosted document collections (private knowledge bases) for retrieval-augmented answers grounded in your own uploads.",
    parameters: Type.Object({
      query: Type.String({
        description:
          "Natural-language instruction sent to the Grok collections-search agent. Must be meaningful and non-empty.",
      }),
      collection_ids: Type.Optional(
        Type.Array(Type.String({ minLength: 1 }), {
          description:
            "Restrict the search to specific collection IDs (max 50). Omit to search all collections the xAI account has access to.",
          maxItems: COLLECTIONS_SEARCH_ID_LIMIT,
        }),
      ),
    }),
    execute,
  };
}
