// Verifies image-generation tool registration through the shared generation harness.
import { describeOpenClawGenerationToolRegistration } from "./grokbot-tools.generation.test-support.js";

describeOpenClawGenerationToolRegistration({
  suiteName: "grokbot tools image generation registration",
  toolName: "image_generate",
  toolLabel: "an image-generation tool",
});
