/**
 * Browser test-support re-exports from shared plugin-sdk test fixtures.
 */
import fs from "node:fs";
import path from "node:path";
import { resolvePreferredOpenClawTmpDir } from "grokbot/plugin-sdk/temp-path";

export {
  createCliRuntimeCapture,
  expectGeneratedTokenPersistedToGatewayAuth,
  type CliRuntimeCapture,
} from "grokbot/plugin-sdk/test-fixtures";
export { createTempHomeEnv } from "grokbot/plugin-sdk/test-env";
export type { TempHomeEnv } from "grokbot/plugin-sdk/test-env";
export { isLiveTestEnabled } from "grokbot/plugin-sdk/test-live";
export type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";

export function useAutoCleanupTempDirTracker(registerCleanup: (cleanup: () => void) => unknown) {
  const dirs = new Set<string>();
  registerCleanup(() => {
    for (const dir of dirs) {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 });
    }
    dirs.clear();
  });
  return {
    make(prefix: string): string {
      const dir = fs.mkdtempSync(path.join(resolvePreferredOpenClawTmpDir(), prefix));
      dirs.add(dir);
      return dir;
    },
  };
}
