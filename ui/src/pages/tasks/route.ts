import { definePage } from "@grokbot/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "tasks",
  path: "/tasks",
  component: () =>
    import("./tasks-page.ts").then(() => ({
      header: true,
      render: () => html`<grokbot-tasks-page></grokbot-tasks-page>`,
    })),
});
