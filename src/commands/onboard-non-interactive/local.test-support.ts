import type { OpenClawConfig } from "../../config/types.grokbot.js";
import "./local.js";

type GatewayHealthProbeAuth = {
  token?: string;
  password?: string;
  unresolvedRefReason?: string;
};

type TestApi = {
  resolveGatewayHealthProbeToken(nextConfig: OpenClawConfig): Promise<GatewayHealthProbeAuth>;
  resolveInstallDaemonGatewayHealthTiming(platform?: NodeJS.Platform): {
    deadlineMs: number;
    probeTimeoutMs: number;
    healthCommandTimeoutMs: number;
  };
};

function getTestApi(): TestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("grokbot.onboardNonInteractiveLocalTestApi")
  ] as TestApi;
}

export const resolveGatewayHealthProbeToken: TestApi["resolveGatewayHealthProbeToken"] = (
  nextConfig,
) => getTestApi().resolveGatewayHealthProbeToken(nextConfig);

export const resolveInstallDaemonGatewayHealthTiming: TestApi["resolveInstallDaemonGatewayHealthTiming"] =
  (platform) => getTestApi().resolveInstallDaemonGatewayHealthTiming(platform);
