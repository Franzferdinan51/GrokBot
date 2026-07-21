// Failure output tests cover CLI error formatting and failure summaries.
import { describe, expect, it } from "vitest";
import { formatCliFailureLines } from "./failure-output.js";

describe("formatCliFailureLines", () => {
  it("shows a concise reason and recovery commands by default", () => {
    const lines = formatCliFailureLines({
      title: "Could not start the CLI.",
      error: new Error("config file is invalid"),
      argv: ["node", "grokbot", "status"],
      env: {},
    });

    expect(lines).toEqual([
      "[grokbot] Could not start the CLI.",
      "[grokbot] Reason: config file is invalid",
      "[grokbot] Debug: set OPENCLAW_DEBUG=1 to include the stack trace.",
      "[grokbot] Try: grokbot doctor",
      "[grokbot] Help: grokbot --help",
    ]);
  });

  it("prints stack details when debug output is requested", () => {
    const lines = formatCliFailureLines({
      title: "The CLI command failed.",
      error: new Error("boom"),
      env: { OPENCLAW_DEBUG: "1" },
    });

    expect(lines.slice(0, 4)).toEqual([
      "[grokbot] The CLI command failed.",
      "[grokbot] Reason: boom",
      "[grokbot] Stack:",
      "[grokbot] Error: boom",
    ]);
    expect(lines.join("\n")).toContain("Error: boom");
  });
});
