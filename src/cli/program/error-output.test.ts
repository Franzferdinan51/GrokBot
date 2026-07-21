// Error output tests cover program-level error display and exit messaging.
import { describe, expect, it } from "vitest";
import { formatCliParseErrorOutput } from "./error-output.js";

describe("formatCliParseErrorOutput", () => {
  it("explains unknown commands with root help and plugin hints", () => {
    const output = formatCliParseErrorOutput("error: unknown command 'wat'\n", {
      argv: ["node", "grokbot", "wat"],
    });

    expect(output).toBe(
      'GrokBot does not know the command "wat".\nTry: grokbot --help\nPlugin command? grokbot plugins list\nDocs: https://docs.grokbot.ai/cli\n',
    );
  });

  it("suggests close known commands for unknown commands", () => {
    const output = formatCliParseErrorOutput("error: unknown command 'upate'\n", {
      argv: ["node", "grokbot", "upate"],
    });

    expect(output).toBe(
      'GrokBot does not know the command "upate".\nDid you mean this?\n  grokbot update\nTry: grokbot --help\nPlugin command? grokbot plugins list\nDocs: https://docs.grokbot.ai/cli\n',
    );
  });

  it("suggests explicit aliases for common adjacent terminology", () => {
    const output = formatCliParseErrorOutput("error: unknown command 'upgrade'\n", {
      argv: ["node", "grokbot", "upgrade"],
    });

    expect(output).toContain("Did you mean this?\n  grokbot update\n");
  });

  it("preserves active profile context in command suggestions", () => {
    const originalProfile = process.env.OPENCLAW_PROFILE;
    process.env.OPENCLAW_PROFILE = "work";
    try {
      const output = formatCliParseErrorOutput("error: unknown command 'doctr'\n", {
        argv: ["node", "grokbot", "doctr"],
      });

      expect(output).toContain("Did you mean this?\n  grokbot --profile work doctor\n");
    } finally {
      if (originalProfile === undefined) {
        delete process.env.OPENCLAW_PROFILE;
      } else {
        process.env.OPENCLAW_PROFILE = originalProfile;
      }
    }
  });

  it("points unknown options at the active command help", () => {
    const output = formatCliParseErrorOutput("error: unknown option '--wat'\n", {
      argv: ["node", "grokbot", "channels", "status", "--wat"],
    });

    expect(output).toBe(
      'GrokBot does not recognize option "--wat".\nTry: grokbot channels status --help\n',
    );
  });

  it("points missing required arguments at command help", () => {
    const output = formatCliParseErrorOutput("error: missing required argument 'name'\n", {
      argv: ["node", "grokbot", "plugins", "install"],
    });

    expect(output).toBe(
      'Missing required argument "name".\nTry: grokbot plugins install --help\n',
    );
  });
});
