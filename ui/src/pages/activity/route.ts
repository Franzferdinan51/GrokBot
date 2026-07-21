import { definePage } from "@grokbot/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "activity",
  path: "/activity",
  component: () =>
    import("./activity-page.ts").then(() => ({
      header: true,
      render: () => html`<grokbot-activity-page></grokbot-activity-page>`,
    })),
});
