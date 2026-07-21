import { definePage } from "@grokbot/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "logs",
  path: "/logs",
  component: () =>
    import("./logs-page.ts").then(() => ({
      header: true,
      render: () => html`<grokbot-logs-page></grokbot-logs-page>`,
    })),
});
