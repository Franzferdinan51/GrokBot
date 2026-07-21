// Mattermost plugin module implements secret input behavior.
export type { SecretInput } from "grokbot/plugin-sdk/secret-input";
export {
  buildSecretInputSchema,
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
  normalizeSecretInputString,
} from "grokbot/plugin-sdk/secret-input";
