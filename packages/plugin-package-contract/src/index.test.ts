// Plugin Package Contract tests cover index behavior.
import { describe, expect, it } from "vitest";
import {
  EXTERNAL_CODE_PLUGIN_REQUIRED_FIELD_PATHS,
  listMissingExternalCodePluginFieldPaths,
  normalizeExternalPluginCompatibility,
  validateExternalCodePluginPackageJson,
} from "./index.js";

describe("@grokbot/plugin-package-contract", () => {
  it("normalizes the GrokBot compatibility block for external plugins", () => {
    expect(
      normalizeExternalPluginCompatibility({
        version: "1.2.3",
        grokbot: {
          compat: {
            pluginApi: ">=2026.3.24-beta.2",
            minGatewayVersion: "2026.3.24-beta.2",
          },
          build: {
            openclawVersion: "2026.3.24-beta.2",
            pluginSdkVersion: "0.9.0",
          },
        },
      }),
    ).toEqual({
      pluginApiRange: ">=2026.3.24-beta.2",
      builtWithOpenClawVersion: "2026.3.24-beta.2",
      pluginSdkVersion: "0.9.0",
      minGatewayVersion: "2026.3.24-beta.2",
    });
  });

  it("falls back to install.minHostVersion and package version when compatible", () => {
    expect(
      normalizeExternalPluginCompatibility({
        version: "1.2.3",
        grokbot: {
          compat: {
            pluginApi: ">=1.0.0",
          },
          install: {
            minHostVersion: "2026.3.24-beta.2",
          },
        },
      }),
    ).toEqual({
      pluginApiRange: ">=1.0.0",
      builtWithOpenClawVersion: "1.2.3",
      minGatewayVersion: "2026.3.24-beta.2",
    });
  });

  it("lists the required external code-plugin fields", () => {
    expect(EXTERNAL_CODE_PLUGIN_REQUIRED_FIELD_PATHS).toEqual([
      "grokbot.compat.pluginApi",
      "grokbot.build.openclawVersion",
    ]);
  });

  it("reports missing required fields with stable field paths", () => {
    const packageJson = {
      grokbot: {
        compat: {},
        build: {},
      },
    };

    expect(listMissingExternalCodePluginFieldPaths(packageJson)).toEqual([
      "grokbot.compat.pluginApi",
      "grokbot.build.openclawVersion",
    ]);
    expect(validateExternalCodePluginPackageJson(packageJson).issues).toEqual([
      {
        fieldPath: "grokbot.compat.pluginApi",
        message: "grokbot.compat.pluginApi is required for external code plugin packages.",
      },
      {
        fieldPath: "grokbot.build.openclawVersion",
        message: "grokbot.build.openclawVersion is required for external code plugin packages.",
      },
    ]);
  });
});
