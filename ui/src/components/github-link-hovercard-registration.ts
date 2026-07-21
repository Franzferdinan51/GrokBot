import { GitHubLinkHovercardProvider } from "./github-link-hovercard.ts";

if (!customElements.get("grokbot-github-link-hovercard-provider")) {
  customElements.define("grokbot-github-link-hovercard-provider", GitHubLinkHovercardProvider);
}
