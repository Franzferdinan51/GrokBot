import type { AuthProfileStore } from "../../../agents/auth-profiles/types.js";
import type { OpenClawConfig } from "../../../config/types.grokbot.js";
import "./stale-auth-order.js";

type TestApi = {
  repairStaleConfiguredAuthOrders(params: {
    cfg: OpenClawConfig;
    stores: readonly AuthProfileStore[];
    activeStores?: readonly AuthProfileStore[];
    runtimeProfileIds?: ReadonlySet<string>;
  }): { config: OpenClawConfig; changes: string[] };
};

function getTestApi(): TestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("grokbot.staleAuthOrderTestApi")
  ] as TestApi;
}

export const repairStaleConfiguredAuthOrders: TestApi["repairStaleConfiguredAuthOrders"] = (
  params,
) => getTestApi().repairStaleConfiguredAuthOrders(params);
