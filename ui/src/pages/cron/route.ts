import { definePage } from "@grokbot/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "cron",
  path: "/cron",
  component: () =>
    import("./cron-page.ts").then(() => ({
      header: true,
      render: () => html`<grokbot-cron-page></grokbot-cron-page>`,
    })),
});
