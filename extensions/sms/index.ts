// Sms plugin entrypoint registers its GrokBot integration.
import { defineBundledChannelEntry } from "grokbot/plugin-sdk/channel-entry-contract";

export default defineBundledChannelEntry({
  id: "sms",
  name: "SMS",
  description: "Twilio SMS channel plugin for GrokBot text messages.",
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "smsPlugin",
  },
  runtime: {
    specifier: "./api.js",
    exportName: "setSmsRuntime",
  },
});
