// Plugin install plan tests cover install planning for local, registry, and bundled plugins.
import { installedPluginRoot } from "grokbot/plugin-sdk/test-fixtures";
import { describe, expect, it, vi } from "vitest";
import { PLUGIN_INSTALL_ERROR_CODE } from "../plugins/install.js";
import {
  resolveCatalogOfficialExternalInstallPlan,
  resolveCatalogOfficialExternalNpmPackageTrust,
} from "../plugins/official-external-install-trust.js";
import {
  resolveBundledInstallPlanForCatalogEntry,
  resolveBundledInstallPlanBeforeNpm,
  resolveBundledInstallPlanForNpmFailure,
} from "./plugin-install-plan.js";

describe("plugin install plan helpers", () => {
  it("prefers bundled plugin for bare plugin-id specs", () => {
    const findBundledSource = vi.fn().mockReturnValue({
      pluginId: "voice-call",
      localPath: installedPluginRoot("/tmp", "voice-call"),
      npmSpec: "@grokbot/voice-call",
    });

    const result = resolveBundledInstallPlanBeforeNpm({
      rawSpec: "voice-call",
      findBundledSource,
    });

    expect(findBundledSource).toHaveBeenCalledWith({ kind: "pluginId", value: "voice-call" });
    expect(result?.bundledSource.pluginId).toBe("voice-call");
    expect(result?.warning).toContain('bare install spec "voice-call"');
  });

  it("prefers bundled plugin for scoped npm package specs", () => {
    const findBundledSource = vi
      .fn()
      .mockImplementation(({ kind, value }: { kind: "pluginId" | "npmSpec"; value: string }) => {
        if (kind === "npmSpec" && value === "@grokbot/voice-call") {
          return {
            pluginId: "voice-call",
            localPath: installedPluginRoot("/tmp", "voice-call"),
            npmSpec: "@grokbot/voice-call",
          };
        }
        return undefined;
      });
    const result = resolveBundledInstallPlanBeforeNpm({
      rawSpec: "@grokbot/voice-call@2026.5.20",
      findBundledSource,
    });

    expect(findBundledSource).toHaveBeenCalledWith({
      kind: "npmSpec",
      value: "@grokbot/voice-call@2026.5.20",
    });
    expect(findBundledSource).toHaveBeenCalledWith({
      kind: "npmSpec",
      value: "@grokbot/voice-call",
    });
    expect(result?.bundledSource.pluginId).toBe("voice-call");
    expect(result?.warning).toContain('npm install spec "@grokbot/voice-call@2026.5.20"');
    expect(result?.warning).toContain("npm:@grokbot/voice-call@2026.5.20");
  });

  it("skips bundled pre-plan for npm specs that do not match bundled packages", () => {
    const findBundledSource = vi.fn();
    const result = resolveBundledInstallPlanBeforeNpm({
      rawSpec: "@grokbot/not-bundled",
      findBundledSource,
    });

    expect(result).toBeNull();
  });

  it("resolves exact official external plugin ids before npm fallback", () => {
    const result = resolveCatalogOfficialExternalInstallPlan("wecom-grokbot-plugin");

    expect(result).toEqual({
      pluginId: "wecom-grokbot-plugin",
      npmSpec: "@wecom/wecom-grokbot-plugin@2026.5.7",
      expectedIntegrity:
        "sha512-TCkP9as00WfEhgFWG8YL/rcmaWGIshAki2HQh83nTRccGfVBCoGjrEboTTqq3yDmK9koWTV11zi8u8A4dNtvug==",
    });
  });

  it("skips official external plan for explicit npm selectors", () => {
    expect(resolveCatalogOfficialExternalInstallPlan("wecom-grokbot-plugin@beta")).toBeNull();
    expect(
      resolveCatalogOfficialExternalInstallPlan("@wecom/wecom-grokbot-plugin@2026.5.7"),
    ).toBeNull();
  });

  it("trusts exact official external npm packages without remapping the spec", () => {
    const result = resolveCatalogOfficialExternalNpmPackageTrust(
      "@wecom/wecom-grokbot-plugin@2026.5.7",
    );

    expect(result).toEqual({
      pluginId: "wecom-grokbot-plugin",
      expectedIntegrity:
        "sha512-TCkP9as00WfEhgFWG8YL/rcmaWGIshAki2HQh83nTRccGfVBCoGjrEboTTqq3yDmK9koWTV11zi8u8A4dNtvug==",
      trustedSourceLinkedOfficialInstall: true,
    });
  });

  it("does not trust npm package names outside the official external catalog", () => {
    const result = resolveCatalogOfficialExternalNpmPackageTrust("@acme/outside@1.0.0");

    expect(result).toBeNull();
  });

  it("prefers bundled catalog plugin by id before npm spec", () => {
    const findBundledSource = vi
      .fn()
      .mockImplementation(({ kind, value }: { kind: "pluginId" | "npmSpec"; value: string }) => {
        if (kind === "pluginId" && value === "voice-call") {
          return {
            pluginId: "voice-call",
            localPath: installedPluginRoot("/tmp", "voice-call"),
            npmSpec: "@grokbot/voice-call",
          };
        }
        return undefined;
      });

    const result = resolveBundledInstallPlanForCatalogEntry({
      pluginId: "voice-call",
      npmSpec: "@grokbot/voice-call",
      findBundledSource,
    });

    expect(findBundledSource).toHaveBeenCalledWith({ kind: "pluginId", value: "voice-call" });
    expect(result?.bundledSource.localPath).toBe(installedPluginRoot("/tmp", "voice-call"));
  });

  it("rejects npm-spec matches that resolve to a different plugin id", () => {
    const findBundledSource = vi
      .fn()
      .mockImplementation(({ kind }: { kind: "pluginId" | "npmSpec"; value: string }) => {
        if (kind === "npmSpec") {
          return {
            pluginId: "not-voice-call",
            localPath: installedPluginRoot("/tmp", "not-voice-call"),
            npmSpec: "@grokbot/voice-call",
          };
        }
        return undefined;
      });

    const result = resolveBundledInstallPlanForCatalogEntry({
      pluginId: "voice-call",
      npmSpec: "@grokbot/voice-call",
      findBundledSource,
    });

    expect(result).toBeNull();
  });

  it("rejects plugin-id bundled matches when the catalog npm spec was overridden", () => {
    const findBundledSource = vi
      .fn()
      .mockImplementation(({ kind }: { kind: "pluginId" | "npmSpec"; value: string }) => {
        if (kind === "pluginId") {
          return {
            pluginId: "whatsapp",
            localPath: installedPluginRoot("/tmp", "whatsapp"),
            npmSpec: "@grokbot/whatsapp",
          };
        }
        return undefined;
      });

    const result = resolveBundledInstallPlanForCatalogEntry({
      pluginId: "whatsapp",
      npmSpec: "@vendor/whatsapp-fork",
      findBundledSource,
    });

    expect(result).toBeNull();
  });

  it("uses npm-spec bundled fallback only for package-not-found", () => {
    const findBundledSource = vi.fn().mockReturnValue({
      pluginId: "voice-call",
      localPath: installedPluginRoot("/tmp", "voice-call"),
      npmSpec: "@grokbot/voice-call",
    });
    const result = resolveBundledInstallPlanForNpmFailure({
      rawSpec: "@grokbot/voice-call",
      code: PLUGIN_INSTALL_ERROR_CODE.NPM_PACKAGE_NOT_FOUND,
      findBundledSource,
    });

    expect(findBundledSource).toHaveBeenCalledWith({
      kind: "npmSpec",
      value: "@grokbot/voice-call",
    });
    expect(result?.warning).toContain("npm package unavailable");
  });

  it("skips fallback for non-not-found npm failures", () => {
    const findBundledSource = vi.fn();
    const result = resolveBundledInstallPlanForNpmFailure({
      rawSpec: "@grokbot/voice-call",
      code: "INSTALL_FAILED",
      findBundledSource,
    });

    expect(findBundledSource).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
