// Xai plugin module implements collections search shared behavior.
import { readProviderJsonObjectResponse } from "grokbot/plugin-sdk/provider-http";
import { postTrustedWebToolsJson, wrapWebContent } from "grokbot/plugin-sdk/provider-web-search";
import { XAI_DEFAULT_MODEL_ID } from "../model-definitions.js";
import {
  buildXaiResponsesToolBody,
  requireXaiResponseTextCitationsAndInline,
  resolveXaiResponsesEndpoint,
} from "./responses-tool-shared.js";
import {
  coerceXaiToolConfig,
  resolveNormalizedXaiToolModel,
  resolvePositiveIntegerToolConfig,
} from "./tool-config-shared.js";
import type { XaiWebSearchResponse } from "./web-search-shared.js";

export const XAI_DEFAULT_COLLECTIONS_SEARCH_MODEL = XAI_DEFAULT_MODEL_ID;

type XaiCollectionsSearchConfig = {
  apiKey?: unknown;
  baseUrl?: unknown;
  model?: unknown;
  inlineCitations?: unknown;
  maxTurns?: unknown;
  collectionIds?: unknown;
};

export type XaiCollectionsSearchOptions = {
  query: string;
  collectionIds?: string[];
};

type XaiCollectionsSearchResult = {
  content: string;
  citations: string[];
  inlineCitations?: XaiWebSearchResponse["inline_citations"];
};

function resolveXaiCollectionsSearchConfig(
  config?: Record<string, unknown>,
): XaiCollectionsSearchConfig {
  return coerceXaiToolConfig(config) as XaiCollectionsSearchConfig;
}

export function resolveXaiCollectionsSearchModel(
  config?: Record<string, unknown>,
): string {
  return resolveNormalizedXaiToolModel({
    config,
    defaultModel: XAI_DEFAULT_COLLECTIONS_SEARCH_MODEL,
  });
}

export function resolveXaiCollectionsSearchEndpoint(
  config?: Record<string, unknown>,
): string {
  return resolveXaiResponsesEndpoint(resolveXaiCollectionsSearchConfig(config).baseUrl);
}

export function resolveXaiCollectionsSearchInlineCitations(
  config?: Record<string, unknown>,
): boolean {
  return resolveXaiCollectionsSearchConfig(config).inlineCitations === true;
}

export function resolveXaiCollectionsSearchMaxTurns(
  config?: Record<string, unknown>,
): number | undefined {
  return resolvePositiveIntegerToolConfig(config, "maxTurns");
}

export function resolveXaiCollectionsSearchIds(
  config?: Record<string, unknown>,
): string[] | undefined {
  const raw = resolveXaiCollectionsSearchConfig(config).collectionIds;
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const ids = raw.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  return ids.length > 0 ? ids : undefined;
}

function buildCollectionsSearchTool(options: XaiCollectionsSearchOptions): Record<string, unknown> {
  // Wire format: the xAI Responses API exposes collections_search under the
  // file_search tool type with vector_store_ids (the OpenAI-Responses shim
  // xAI adopts). See https://docs.x.ai/developers/tools/collections-search.
  return {
    type: "file_search",
    ...(options.collectionIds?.length ? { vector_store_ids: options.collectionIds } : {}),
  };
}

export function buildXaiCollectionsSearchPayload(params: {
  query: string;
  model: string;
  tookMs: number;
  content: string;
  citations: string[];
  inlineCitations?: XaiWebSearchResponse["inline_citations"];
  options?: XaiCollectionsSearchOptions;
}): Record<string, unknown> {
  return {
    query: params.query,
    provider: "xai",
    model: params.model,
    tookMs: params.tookMs,
    externalContent: {
      untrusted: true,
      source: "collections_search",
      provider: "xai",
      wrapped: true,
    },
    content: wrapWebContent(params.content, "web_search"),
    citations: params.citations,
    ...(params.inlineCitations ? { inlineCitations: params.inlineCitations } : {}),
    ...(params.options?.collectionIds?.length
      ? { collectionIds: params.options.collectionIds }
      : {}),
  };
}

export async function requestXaiCollectionsSearch(params: {
  apiKey: string;
  endpoint: string;
  model: string;
  timeoutSeconds: number;
  inlineCitations: boolean;
  maxTurns?: number;
  options: XaiCollectionsSearchOptions;
}): Promise<XaiCollectionsSearchResult> {
  return await postTrustedWebToolsJson(
    {
      url: params.endpoint,
      timeoutSeconds: params.timeoutSeconds,
      apiKey: params.apiKey,
      body: buildXaiResponsesToolBody({
        model: params.model,
        inputText: params.options.query,
        tools: [buildCollectionsSearchTool(params.options)],
        maxTurns: params.maxTurns,
        reasoningEffort: params.model === XAI_DEFAULT_COLLECTIONS_SEARCH_MODEL ? "none" : undefined,
      }),
      errorLabel: "xAI",
    },
    async (response: Response) => {
      const data = (await readProviderJsonObjectResponse(
        response,
        "xAI collections search failed",
      )) as XaiWebSearchResponse;
      return requireXaiResponseTextCitationsAndInline(
        data,
        "xAI collections search failed",
        params.inlineCitations,
      );
    },
  );
}
