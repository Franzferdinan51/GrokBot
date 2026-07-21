import { pluginRegistrationContractCases } from "grokbot/plugin-sdk/plugin-test-contracts";
import { describePluginRegistrationContract } from "grokbot/plugin-sdk/plugin-test-contracts";

describePluginRegistrationContract(pluginRegistrationContractCases.parallel);
