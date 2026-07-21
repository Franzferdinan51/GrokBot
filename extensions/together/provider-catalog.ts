// Together provider module implements model/runtime integration.
import { buildManifestModelProviderConfig } from "grokbot/plugin-sdk/provider-catalog-shared";
import type { ModelProviderConfig } from "grokbot/plugin-sdk/provider-model-shared";
import manifest from "./grokbot.plugin.json" with { type: "json" };

export function buildTogetherProvider(): ModelProviderConfig {
  return buildManifestModelProviderConfig({
    providerId: "together",
    catalog: manifest.modelCatalog.providers.together,
  });
}
