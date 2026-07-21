// Matrix plugin module implements monitor route test support behavior.
export {
  registerSessionBindingAdapter,
  testing,
} from "grokbot/plugin-sdk/session-binding-runtime";
export { resolveAgentRoute } from "grokbot/plugin-sdk/routing";
export {
  createTestRegistry,
  setActivePluginRegistry,
} from "grokbot/plugin-sdk/plugin-test-runtime";
export type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
