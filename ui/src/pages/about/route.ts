import { definePage } from "@grokbot/uirouter";
import { html } from "lit";

export const page = definePage({
  id: "about",
  path: "/settings/about",
  component: () =>
    import("./about-page.ts").then(() => ({
      header: true,
      render: () => html`<grokbot-about-page></grokbot-about-page>`,
    })),
});
