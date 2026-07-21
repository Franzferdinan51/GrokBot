import { definePage } from "@grokbot/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "apps",
  path: "/apps",
  component: () =>
    import("./apps-page.ts").then(() => ({
      header: true,
      render: () => html`<grokbot-apps-page></grokbot-apps-page>`,
    })),
});
