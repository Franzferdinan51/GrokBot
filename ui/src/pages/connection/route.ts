import { definePage } from "@grokbot/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "connection",
  path: "/settings/connection",
  component: () =>
    import("./connection-page.ts").then(() => ({
      header: true,
      render: () => html`<grokbot-connection-page></grokbot-connection-page>`,
    })),
});
