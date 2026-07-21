// Install download test utilities provide isolated state and workspace paths.
import {
  createOpenClawTestState,
  type OpenClawTestState,
} from "../../test-utils/grokbot-test-state.js";

/** Creates isolated GrokBot state for install download tests. */
export async function createInstallDownloadTestState(): Promise<OpenClawTestState> {
  return await createOpenClawTestState({
    layout: "state-only",
    prefix: "grokbot-skills-install-",
  });
}
