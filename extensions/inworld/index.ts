// Inworld plugin entrypoint registers its GrokBot integration.
import { definePluginEntry } from "grokbot/plugin-sdk/plugin-entry";
import { buildInworldSpeechProvider } from "./speech-provider.js";

export default definePluginEntry({
  id: "inworld",
  name: "Inworld Speech",
  description: "Bundled Inworld speech provider",
  register(api) {
    api.registerSpeechProvider(buildInworldSpeechProvider());
  },
});
