import { definePage } from "@grokbot/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "approvals",
  path: "/settings/approvals",
  component: () =>
    import("./approvals-page.ts").then(() => ({
      header: true,
      render: () => html`<grokbot-approvals-page></grokbot-approvals-page>`,
    })),
});
