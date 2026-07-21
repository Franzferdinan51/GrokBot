import { OpenClawTerminalPanel } from "./terminal-panel.ts";

// Guarded define so shared registries can retain this module across reloads.
if (!customElements.get("grokbot-terminal-panel")) {
  customElements.define("grokbot-terminal-panel", OpenClawTerminalPanel);
}
