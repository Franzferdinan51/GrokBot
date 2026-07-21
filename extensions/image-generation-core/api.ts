// Image Generation Core API module exposes the plugin public contract.
export type { AuthProfileStore } from "grokbot/plugin-sdk/image-generation-core";
export {
  buildNoCapabilityModelConfiguredMessage,
  createSubsystemLogger,
  describeFailoverError,
  getImageGenerationProvider,
  getProviderEnvVars,
  isFailoverError,
  listImageGenerationProviders,
  normalizeGoogleModelId,
  OPENAI_DEFAULT_IMAGE_MODEL,
  parseImageGenerationModelRef,
  resolveAgentModelFallbackValues,
  resolveAgentModelPrimaryValue,
  resolveApiKeyForProvider,
  resolveCapabilityModelCandidates,
  throwCapabilityGenerationFailure,
} from "grokbot/plugin-sdk/image-generation-core";
export type {
  FallbackAttempt,
  GeneratedImageAsset,
  ImageGenerationProvider,
  ImageGenerationProviderConfiguredContext,
  ImageGenerationProviderPlugin,
  ImageGenerationRequest,
  ImageGenerationResolution,
  ImageGenerationResult,
  ImageGenerationSourceImage,
  OpenClawConfig,
} from "grokbot/plugin-sdk/image-generation-core";
