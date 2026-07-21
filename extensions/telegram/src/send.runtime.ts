// Telegram plugin module implements send behavior.
export { requireRuntimeConfig } from "grokbot/plugin-sdk/plugin-config-runtime";
export { resolveMarkdownTableMode } from "grokbot/plugin-sdk/markdown-table-runtime";
export type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
export type { PollInput, MediaKind } from "grokbot/plugin-sdk/media-runtime";
export {
  buildOutboundMediaLoadOptions,
  getImageMetadata,
  isGifMedia,
  kindFromMime,
  normalizePollInput,
  probeVideoDimensions,
} from "grokbot/plugin-sdk/media-runtime";
export { loadWebMedia } from "grokbot/plugin-sdk/web-media";
