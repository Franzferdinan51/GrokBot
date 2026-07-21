import { definePage } from "@grokbot/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "debug",
  path: "/debug",
  component: () =>
    import("./debug-page.ts").then(() => ({
      header: true,
      render: () => html`<grokbot-debug-page></grokbot-debug-page>`,
    })),
});
