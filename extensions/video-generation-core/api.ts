// Video Generation Core API module exposes the plugin public contract.
export type { AuthProfileStore } from "grokbot/plugin-sdk/video-generation-core";
export {
  buildNoCapabilityModelConfiguredMessage,
  createSubsystemLogger,
  describeFailoverError,
  getProviderEnvVars,
  getVideoGenerationProvider,
  isFailoverError,
  listVideoGenerationProviders,
  parseVideoGenerationModelRef,
  resolveAgentModelFallbackValues,
  resolveAgentModelPrimaryValue,
  resolveCapabilityModelCandidates,
  throwCapabilityGenerationFailure,
} from "grokbot/plugin-sdk/video-generation-core";
export type {
  FallbackAttempt,
  GeneratedVideoAsset,
  OpenClawConfig,
  VideoGenerationIgnoredOverride,
  VideoGenerationMode,
  VideoGenerationModeCapabilities,
  VideoGenerationProvider,
  VideoGenerationProviderCapabilities,
  VideoGenerationProviderConfiguredContext,
  VideoGenerationProviderPlugin,
  VideoGenerationRequest,
  VideoGenerationResolution,
  VideoGenerationResult,
  VideoGenerationSourceAsset,
  VideoGenerationTransformCapabilities,
} from "grokbot/plugin-sdk/video-generation-core";
