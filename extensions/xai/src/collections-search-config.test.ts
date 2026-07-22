// Xai tests cover collections search config plugin behavior.
import type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
import { describe, expect, it } from "vitest";
import {
  resolveEffectiveCollectionsSearchConfig,
  setPluginCollectionsSearchConfigValue,
} from "./collections-search-config.js";

function cfgWithCollectionsSearch(overrides: Record<string, unknown>): OpenClawConfig {
  return {
    plugins: {
      entries: {
        xai: {
          config: {
            collectionsSearch: { ...overrides },
          },
        },
      },
    },
  } as OpenClawConfig;
}

describe("xai collections search config", () => {
  it("returns undefined when the plugin is not registered", () => {
    expect(resolveEffectiveCollectionsSearchConfig({})).toBeUndefined();
    expect(resolveEffectiveCollectionsSearchConfig(undefined)).toBeUndefined();
  });

  it("returns undefined when the collectionsSearch block is absent", () => {
    const cfg = {
      plugins: { entries: { xai: { config: { webSearch: { enabled: true } } } } },
    } as OpenClawConfig;
    expect(resolveEffectiveCollectionsSearchConfig(cfg)).toBeUndefined();
  });

  it("returns a clone of the plugin collectionsSearch config when present", () => {
    const cfg = cfgWithCollectionsSearch({
      enabled: true,
      model: "grok-4.5",
      collectionIds: ["col-1"],
    });
    const resolved = resolveEffectiveCollectionsSearchConfig(cfg);
    expect(resolved).toEqual({
      enabled: true,
      model: "grok-4.5",
      collectionIds: ["col-1"],
    });
    // Must not be the same reference — callers must not mutate the source config.
    const original = cfg.plugins!.entries!.xai!.config!.collectionsSearch!;
expect(resolved).not.toBe(original);
  });

  it("setPluginCollectionsSearchConfigValue creates the nested structure when missing", () => {
    const cfg = {} as OpenClawConfig;
    setPluginCollectionsSearchConfigValue(cfg, "enabled", true);
    expect(cfg).toEqual({
      plugins: { entries: { xai: { config: { collectionsSearch: { enabled: true } } } } },
    });
  });

  it("setPluginCollectionsSearchConfigValue preserves existing values when adding new ones", () => {
    const cfg = cfgWithCollectionsSearch({ enabled: true });
    setPluginCollectionsSearchConfigValue(cfg, "model", "grok-4.5");
    setPluginCollectionsSearchConfigValue(cfg, "collectionIds", ["col-1", "col-2"]);
    const resolved = resolveEffectiveCollectionsSearchConfig(cfg);
    expect(resolved).toEqual({
      enabled: true,
      model: "grok-4.5",
      collectionIds: ["col-1", "col-2"],
    });
  });

  it("explicitly disabled (enabled:false) survives a re-round-trip", () => {
    const cfg = cfgWithCollectionsSearch({ enabled: false });
    setPluginCollectionsSearchConfigValue(cfg, "model", "grok-4.5");
    expect(resolveEffectiveCollectionsSearchConfig(cfg)).toEqual({
      enabled: false,
      model: "grok-4.5",
    });
  });
});
