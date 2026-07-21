// Discord plugin module implements approval runtime behavior.
export {
  isChannelExecApprovalClientEnabledFromConfig,
  matchesApprovalRequestFilters,
  getExecApprovalReplyMetadata,
} from "grokbot/plugin-sdk/approval-client-runtime";
export { resolveApprovalApprovers } from "grokbot/plugin-sdk/approval-auth-runtime";
export { createApproverRestrictedNativeApprovalCapability } from "grokbot/plugin-sdk/approval-delivery-runtime";
export {
  createChannelApproverDmTargetResolver,
  createChannelNativeOriginTargetResolver,
} from "grokbot/plugin-sdk/approval-native-runtime";
