import { definePage } from "@grokbot/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "worktrees",
  path: "/worktrees",
  aliases: ["/settings/worktrees"],
  component: () =>
    import("./worktrees-page.ts").then(() => ({
      header: true,
      render: () => html`<grokbot-worktrees-page></grokbot-worktrees-page>`,
    })),
});
