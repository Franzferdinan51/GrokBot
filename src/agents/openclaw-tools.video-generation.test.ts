// Verifies video-generation tool registration through the shared generation harness.
import { describeOpenClawGenerationToolRegistration } from "./grokbot-tools.generation.test-support.js";

describeOpenClawGenerationToolRegistration({
  suiteName: "grokbot tools video generation registration",
  toolName: "video_generate",
  toolLabel: "a video-generation tool",
});
