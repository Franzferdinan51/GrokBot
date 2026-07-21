// Github Copilot tests cover provider auth.contract plugin behavior.
import { describeGithubCopilotProviderAuthContract } from "grokbot/plugin-sdk/provider-test-contracts";

describeGithubCopilotProviderAuthContract(() => import("./index.js"));
