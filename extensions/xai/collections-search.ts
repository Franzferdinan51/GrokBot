// Xai plugin module implements collections search behavior.
import { jsonResult, readStringParam } from "grokbot/plugin-sdk/provider-web-search";
import { getRuntimeConfigSnapshot } from "grokbot/plugin-sdk/runtime-config-snapshot";
import {
  buildMissingCollectionsSearchApiKeyPayload,
  createCollectionsSearchToolDefinition,
} from "./collections-search-tool-shared.js";
import {
  resolveEffectiveCollectionsSearchConfig,
  setPluginCollectionsSearchConfigValue,
} from "./src/collections-search-config.js";
import {
  buildXaiCollectionsSearchPayload,
  requestXaiCollectionsSearch,
  resolveXaiCollectionsSearchEndpoint,
  resolveXaiCollectionsSearchIds,
  resolveXaiCollectionsSearchInlineCitations,
  resolveXaiCollectionsSearchMaxTurns,
  resolveXaiCollectionsSearchModel,
} from "./src/collections-search-shared.js";
import { resolveXaiToolApiKeyWithAuth, type XaiToolAuthContext } from "./src/tool-auth-shared.js";
import { isXaiToolEnabled } from "./src/tool-auth-shared.js";

export function createCollectionsSearchTool(options?: {
  config?: unknown;
  runtimeConfig?: Record<string, unknown> | null;
  auth?: XaiToolAuthContext;
}) {
  const runtimeConfig = options?.runtimeConfig ?? getRuntimeConfigSnapshot();
  const collectionsSearchConfig =
    resolveEffectiveCollectionsSearchConfig(runtimeConfig as never) ??
    resolveEffectiveCollectionsSearchConfig(options?.config as never);

  if (
    !isXaiToolEnabled({
      enabled: collectionsSearchConfig?.enabled as boolean | undefined,
      runtimeConfig: runtimeConfig as never,
      sourceConfig: options?.config as never,
      auth: options?.auth,
    })
  ) {
    return null;
  }

  return createCollectionsSearchToolDefinition(
    async (_toolCallId: string, args: Record<string, unknown>) => {
      const apiKey = await resolveXaiToolApiKeyWithAuth({
        runtimeConfig: (runtimeConfig ?? undefined) as never,
        sourceConfig: options?.config as never,
        auth: options?.auth,
      });
      if (!apiKey) {
        return jsonResult(buildMissingCollectionsSearchApiKeyPayload());
      }

      const query = readStringParam(args, "query", { required: true });
      const collectionIds = Array.isArray(args.collection_ids)
        ? (args.collection_ids as unknown[])
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            .map((value) => value.trim())
        : resolveXaiCollectionsSearchIds(collectionsSearchConfig);

      const configRecord = collectionsSearchConfig as Record<string, unknown> | undefined;
      const model = resolveXaiCollectionsSearchModel(configRecord);
      const endpoint = resolveXaiCollectionsSearchEndpoint(configRecord);
      const inlineCitations = resolveXaiCollectionsSearchInlineCitations(configRecord);
      const maxTurns = resolveXaiCollectionsSearchMaxTurns(configRecord);
      const timeoutSeconds =
        typeof configRecord?.timeoutSeconds === "number" && Number.isFinite(configRecord.timeoutSeconds)
          ? (configRecord.timeoutSeconds as number)
          : 30;
      const startedAt = Date.now();
      const result = await requestXaiCollectionsSearch({
        apiKey,
        endpoint,
        model,
        timeoutSeconds,
        inlineCitations,
        maxTurns,
        options: {
          query,
          ...(collectionIds?.length ? { collectionIds } : {}),
        },
      });
      return jsonResult(
        buildXaiCollectionsSearchPayload({
          query,
          model,
          tookMs: Date.now() - startedAt,
          content: result.content,
          citations: result.citations,
          inlineCitations: result.inlineCitations,
          options: {
            query,
            ...(collectionIds?.length ? { collectionIds } : {}),
          },
        }),
      );
    },
  );
}

export { setPluginCollectionsSearchConfigValue };
