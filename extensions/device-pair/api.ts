// Device Pair API module exposes the plugin public contract.
export {
  approveDevicePairing,
  clearDeviceBootstrapTokens,
  issueDeviceBootstrapToken,
  PAIRING_SETUP_BOOTSTRAP_PROFILE,
  listDevicePairing,
  revokeDeviceBootstrapToken,
  type DeviceBootstrapProfile,
} from "grokbot/plugin-sdk/device-bootstrap";
export { definePluginEntry, type OpenClawPluginApi } from "grokbot/plugin-sdk/plugin-entry";
export {
  resolveGatewayBindUrl,
  resolveGatewayPort,
  resolveTailnetHostWithRunner,
  resolveTailscaleServeGatewayUrlsWithRunner,
} from "grokbot/plugin-sdk/core";
export { resolveAdvertisedLanHost } from "grokbot/plugin-sdk/gateway-runtime";
export {
  resolvePreferredOpenClawTmpDir,
  runPluginCommandWithTimeout,
} from "grokbot/plugin-sdk/sandbox";
export { renderQrPngBase64, renderQrPngDataUrl, writeQrPngTempFile } from "./qr-image.js";
