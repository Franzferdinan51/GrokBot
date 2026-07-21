import type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";

export function resolveZalouserDmSessionScope(config: OpenClawConfig) {
  const configured = config.session?.dmScope;
  return configured === "main" || !configured ? "per-channel-peer" : configured;
}
