// Mistral provider module implements model/runtime integration.
import { buildManifestModelProviderConfig } from "grokbot/plugin-sdk/provider-catalog-shared";
import type { ModelProviderConfig } from "grokbot/plugin-sdk/provider-model-shared";
import manifest from "./grokbot.plugin.json" with { type: "json" };

export function buildMistralProvider(): ModelProviderConfig {
  return buildManifestModelProviderConfig({
    providerId: "mistral",
    catalog: manifest.modelCatalog.providers.mistral,
  });
}
