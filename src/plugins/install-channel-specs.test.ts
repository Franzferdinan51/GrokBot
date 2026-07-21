import { describe, expect, it } from "vitest";
import {
  resolveClawHubInstallSpecsForUpdateChannel,
  resolveNpmInstallSpecsForUpdateChannel,
} from "./install-channel-specs.js";

describe("resolveNpmInstallSpecsForUpdateChannel", () => {
  it.each(["@grokbot/discord", "@grokbot/discord@latest"])(
    "targets the exact core version for official extended-stable intent %s",
    (spec) => {
      expect(
        resolveNpmInstallSpecsForUpdateChannel({
          spec,
          updateChannel: "extended-stable",
          officialPackageName: "@grokbot/discord",
          coreVersion: "2026.7.33",
        }),
      ).toEqual({
        installSpec: "@grokbot/discord@2026.7.33",
        recordSpec: spec,
      });
    },
  );

  it.each([
    "@grokbot/discord@2026.6.33",
    "@grokbot/discord@next",
    "@grokbot/discord@beta",
    "@grokbot/discord@^2026.6.0",
    "https://registry.example.test/discord.tgz",
  ])("preserves explicit extended-stable intent %s", (spec) => {
    expect(
      resolveNpmInstallSpecsForUpdateChannel({
        spec,
        updateChannel: "extended-stable",
        officialPackageName: "@grokbot/discord",
        coreVersion: "2026.7.33",
      }),
    ).toEqual({ installSpec: spec, recordSpec: spec });
  });

  it("does not rewrite a third-party package", () => {
    expect(
      resolveNpmInstallSpecsForUpdateChannel({
        spec: "@acme/discord",
        updateChannel: "extended-stable",
        officialPackageName: "@grokbot/discord",
        coreVersion: "2026.7.33",
      }),
    ).toEqual({ installSpec: "@acme/discord", recordSpec: "@acme/discord" });
  });

  it("fails closed without an authoritative extended-stable core version", () => {
    expect(() =>
      resolveNpmInstallSpecsForUpdateChannel({
        spec: "@grokbot/discord",
        updateChannel: "extended-stable",
        officialPackageName: "@grokbot/discord",
      }),
    ).toThrow("requires an exact core version");
  });

  it("preserves beta behavior", () => {
    expect(
      resolveNpmInstallSpecsForUpdateChannel({
        spec: "@grokbot/discord@latest",
        updateChannel: "beta",
        officialPackageName: "@grokbot/discord",
        coreVersion: "2026.7.33",
      }),
    ).toEqual({
      installSpec: "@grokbot/discord@beta",
      recordSpec: "@grokbot/discord@latest",
      fallbackSpec: "@grokbot/discord@latest",
      fallbackLabel: "@grokbot/discord@beta",
    });
  });
});

describe("resolveClawHubInstallSpecsForUpdateChannel", () => {
  it("does not rewrite ClawHub on extended-stable", () => {
    expect(
      resolveClawHubInstallSpecsForUpdateChannel({
        spec: "clawhub:@grokbot/discord",
        updateChannel: "extended-stable",
      }),
    ).toEqual({
      installSpec: "clawhub:@grokbot/discord",
      recordSpec: "clawhub:@grokbot/discord",
    });
  });
});
