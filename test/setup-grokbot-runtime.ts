// GrokBot-runtime test setup installs shared mocks required for collection_search
// and other plugin tests. Imported by test/vitest scoped configs as a setupFile.
import { installSharedTestSetup } from "./setup.shared.js";

const testEnv = installSharedTestSetup({ loadProfileEnv: false });

export function cleanup() {
  testEnv.cleanup();
}
