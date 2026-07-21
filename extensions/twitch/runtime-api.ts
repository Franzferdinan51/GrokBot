// Private runtime barrel for the bundled Twitch extension.
// Keep this barrel thin and aligned with the local extension surface.

export type {
  ChannelAccountSnapshot,
  ChannelCapabilities,
  ChannelGatewayContext,
  ChannelLogSink,
  ChannelMessageActionAdapter,
  ChannelMessageActionContext,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelOutboundContext,
  ChannelResolveKind,
  ChannelResolveResult,
  ChannelStatusAdapter,
} from "grokbot/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "grokbot/plugin-sdk/channel-core";
export type { OutboundDeliveryResult } from "grokbot/plugin-sdk/channel-send-result";
export type { OpenClawConfig } from "grokbot/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "grokbot/plugin-sdk/runtime";
export type { WizardPrompter } from "grokbot/plugin-sdk/setup";
