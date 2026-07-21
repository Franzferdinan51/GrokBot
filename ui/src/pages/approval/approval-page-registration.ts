import { ApprovalPage } from "./approval-page.ts";

if (!customElements.get("grokbot-approval-page")) {
  customElements.define("grokbot-approval-page", ApprovalPage);
}
