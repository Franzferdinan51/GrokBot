import { AgentSelect } from "./agent-select.ts";

if (!customElements.get("grokbot-agent-select")) {
  customElements.define("grokbot-agent-select", AgentSelect);
}
