/** ACP protocol helpers and GrokBot agent identity metadata. */
export { normalizeAcpProvenanceMode } from "@grokbot/acp-core/types";
import { VERSION } from "../version.js";

/** ACP agent identity advertised during protocol initialization. */
export const ACP_AGENT_INFO = {
  name: "grokbot-acp",
  title: "GrokBot ACP Gateway",
  version: VERSION,
};
