// Provider registry. Looks up provider instances by id, builds them
// from settings.json on demand, and caches them for the session.

import type { Provider } from "../types.js";
import type { Settings } from "../config/settings.js";
import { OpenAICompatProvider } from "./openai-compat.js";
import { AnthropicProvider } from "./anthropic.js";
import { CodexProvider } from "./codex.js";
import { firstEnvValue, getProviderPreset } from "./presets.js";
import { resolveProviderCapabilities } from "./omni.js";
import { ensureFreshCodexTokens, loadCodexRefreshToken } from "./oauth/codex.js";
import { ensureFreshXaiTokens, loadXaiRefreshToken } from "./oauth/xai.js";
import { log } from "../util/logger.js";

export class ProviderRegistry {
  private cache = new Map<string, Provider>();
  /** Externally registered providers (e.g. test stubs). */
  private external = new Map<string, Provider>();
  constructor(private readonly settings: Settings) {}

  list(): Provider[] {
    return [...this.cache.values(), ...this.external.values()];
  }

  /** Register a provider directly (bypasses settings.json lookup). */
  register(id: string, p: Provider): void {
    this.external.set(id, p);
  }

  /** Get the default provider, or undefined if none configured. */
  default(): Provider | undefined {
    const id = this.settings.defaultProvider;
    if (!id) return undefined;
    return this.get(id);
  }

  /** Get a provider by id; build it from settings if not yet cached. */
  get(id: string): Provider | undefined {
    if (this.external.has(id)) return this.external.get(id);
    if (this.cache.has(id)) return this.cache.get(id);
    const profile = this.settings.providers[id];
    if (!profile) return undefined;
    const p = buildProvider(id, profile, this.settings);
    if (p) this.cache.set(id, p);
    return p;
  }

  invalidate(id?: string): void {
    if (id) this.cache.delete(id);
    else this.cache.clear();
  }

  /** List the configured provider ids (in settings.json), even if not built. */
  configuredIds(): string[] {
    return [...new Set([...Object.keys(this.settings.providers), ...this.external.keys()])];
  }
}

function buildProvider(id: string, profile: Settings["providers"][string], settings: Settings): Provider | undefined {
  const preset = getProviderPreset(id);
  const capabilities = resolveProviderCapabilities(preset);

  // Anthropic is the only non-OpenAI-compat provider we ship.
  if (preset?.protocol === "anthropic" || id === "anthropic" || id.startsWith("anthropic-")) {
    const apiKey = resolveCredential(profile, preset);
    if (!apiKey) {
      log.warn(`provider ${id}: missing credential (set ANTHROPIC_API_KEY or settings.json)`);
      return undefined;
    }
    return new AnthropicProvider({
      apiKey,
      defaultModel: profile.model ?? settings.defaultModel ?? preset?.defaultModel ?? "claude-sonnet-4-5",
      baseUrl: profile.baseUrl ?? preset?.defaultBaseUrl,
    });
  }

  const authMode = profile.authMode ?? preset?.defaultAuthMode ?? "apiKey";
  const oauthToken = profile.oauthToken ?? firstEnvValue(preset?.oauthTokenEnv);
  const apiKey = resolveCredential(profile, preset) ??
    process.env.OPENAI_API_KEY ??
    process.env[envKeyFor(id)];

  // Codex OAuth → Responses API provider.
  if ((id === "codex" || preset?.capabilities?.responsesApi) && authMode === "oauth" && oauthToken) {
    void ensureFreshCodexTokens(settings).catch(() => { /* best-effort refresh */ });
    const refreshed = settings.providers[id] ?? profile;
    const token = refreshed.oauthToken ?? oauthToken;
    return new CodexProvider({
      id,
      accessToken: token,
      defaultModel: profile.model ?? settings.defaultModel ?? firstEnvValue(preset?.modelEnv) ?? preset?.defaultModel ?? "gpt-5.1",
      baseUrl: profile.baseUrl ?? preset?.defaultBaseUrl,
      capabilities,
    });
  }

  // xAI / Grok OAuth → auto-refresh the access token, then
  // build an OpenAICompat provider with the (potentially
  // refreshed) token as the apiKey. Same fire-and-forget
  // pattern as the codex branch above. Pre-fix: xAI / Grok
  // OAuth tokens were NEVER auto-refreshed, so after the
  // first hour the provider was constructed with a stale
  // access token and every API call failed with 401 until
  // the user manually re-ran `ch provider login xai` (a
  // much worse UX than the codex flow, which auto-refreshes
  // in this same function). The fire-and-forget pattern
  // means the current call may use a stale token for one
  // request (the refresh completes in the background), but
  // the next call to get("xai") or get("grok") gets the
  // fresh token. Same caveat as the codex branch.
  //
  // xai and grok are aliases for the same xAI API (both use
  // https://api.x.ai/v1); the OAuth refresh is symmetric
  // because both presets share the same OAuth metadata
  // shape (profile.options.xaiOAuth.{refreshToken,expiresAt}).
  let xaiRefreshedToken: string | undefined;
  if ((id === "xai" || id === "grok") && authMode === "oauth" && oauthToken) {
    void ensureFreshXaiTokens(settings).catch(() => { /* best-effort refresh */ });
    const refreshed = settings.providers[id] ?? profile;
    xaiRefreshedToken = refreshed.oauthToken ?? oauthToken;
  }

  // Everything else: openai-compat.
  const baseUrl =
    profile.baseUrl ??
    firstEnvValue(preset?.baseUrlEnv) ??
    (id === "openai" ? "https://api.openai.com/v1" : process.env.OPENAI_BASE_URL) ??
    preset?.defaultBaseUrl;
  if (!baseUrl) {
    log.warn(`provider ${id}: missing baseUrl`);
    return undefined;
  }
  return new OpenAICompatProvider({
    id,
    baseUrl,
    // Use the (potentially refreshed) xAI OAuth token as the
    // apiKey if the xai / grok OAuth branch ran above. For
    // non-xAI / grok providers, this falls back to the
    // `apiKey` resolved at the top of this function.
    apiKey: xaiRefreshedToken ?? apiKey,
    defaultModel: profile.model ?? settings.defaultModel ?? firstEnvValue(preset?.modelEnv) ?? preset?.defaultModel ?? "gpt-4o",
    capabilities,
  });
}

function resolveCredential(profile: Settings["providers"][string], preset: ReturnType<typeof getProviderPreset>): string | undefined {
  const configuredMode = profile.authMode ?? preset?.defaultAuthMode ?? "apiKey";
  const oauthToken = profile.oauthToken ?? firstEnvValue(preset?.oauthTokenEnv);
  const apiKey = profile.apiKey ?? firstEnvValue(preset?.apiKeyEnv);
  if (configuredMode === "oauth") return oauthToken ?? apiKey;
  if (configuredMode === "optional") return apiKey ?? oauthToken;
  return apiKey ?? oauthToken;
}

function envKeyFor(id: string): string {
  return `${id.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_API_KEY`;
}

/** Exported for tests: whether a profile should use CodexProvider. */
export function shouldUseCodexProvider(id: string, profile: Settings["providers"][string]): boolean {
  const preset = getProviderPreset(id);
  const authMode = profile.authMode ?? preset?.defaultAuthMode ?? "apiKey";
  const oauthToken = profile.oauthToken ?? firstEnvValue(preset?.oauthTokenEnv);
  return (id === "codex" || Boolean(preset?.capabilities?.responsesApi)) && authMode === "oauth" && Boolean(oauthToken);
}

export { loadCodexRefreshToken, loadXaiRefreshToken };