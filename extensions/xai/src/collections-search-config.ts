// Xai helper module supports collections search config behavior.
import type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
import { isRecord } from "./tool-config-shared.js";

type JsonRecord = Record<string, unknown>;

function cloneRecord<T extends JsonRecord | undefined>(value: T): T {
  if (!value) {
    return value;
  }
  return { ...value } as T;
}

function resolvePluginCollectionsSearchConfig(config?: OpenClawConfig): JsonRecord | undefined {
  const pluginConfig = config?.plugins?.entries?.xai?.config;
  if (!isRecord(pluginConfig?.collectionsSearch)) {
    return undefined;
  }
  return cloneRecord(pluginConfig.collectionsSearch);
}

export function resolveEffectiveCollectionsSearchConfig(
  config?: OpenClawConfig,
): JsonRecord | undefined {
  return resolvePluginCollectionsSearchConfig(config);
}

export function setPluginCollectionsSearchConfigValue(
  configTarget: OpenClawConfig,
  key: string,
  value: unknown,
): void {
  const plugins = (configTarget.plugins ??= {}) as { entries?: Record<string, unknown> };
  const entries = (plugins.entries ??= {});
  const entry = (entries.xai ??= {}) as { config?: Record<string, unknown> };
  const config = (entry.config ??= {});
  const collectionsSearch = (config.collectionsSearch ??= {}) as Record<string, unknown>;
  collectionsSearch[key] = value;
}
