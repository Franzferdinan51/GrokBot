/**
 * Browser-local SDK setup/tooling bridge for CLI, media, and action helpers.
 */
export {
  callGatewayTool,
  listNodes,
  resolveNodeIdFromList,
  selectDefaultNodeFromList,
} from "grokbot/plugin-sdk/agent-harness-runtime";
export type { AnyAgentTool, NodeListNode } from "grokbot/plugin-sdk/agent-harness-runtime";
export {
  imageResultFromFile,
  jsonResult,
  readPositiveIntegerParam,
  readStringParam,
} from "grokbot/plugin-sdk/channel-actions";
export {
  formatCliCommand,
  formatHelpExamples,
  inheritOptionFromParent,
  note,
  theme,
} from "grokbot/plugin-sdk/cli-runtime";
export { danger, info } from "grokbot/plugin-sdk/runtime-env";
export {
  IMAGE_REDUCE_QUALITY_STEPS,
  buildImageResizeSideGrid,
  getImageMetadata,
  isImageProcessorUnavailableError,
  resizeToJpeg,
} from "grokbot/plugin-sdk/media-runtime";
export { detectMime } from "grokbot/plugin-sdk/media-mime";
export { ensureMediaDir, saveMediaBuffer } from "grokbot/plugin-sdk/media-runtime";
export { describeImageFile } from "grokbot/plugin-sdk/media-understanding-runtime";
export { formatDocsLink } from "grokbot/plugin-sdk/setup-tools";
