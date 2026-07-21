// Daemon runtime hint tests cover platform-specific daemon guidance.
import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          HOME: "/Users/test",
          OPENCLAW_STATE_DIR: "/tmp/grokbot-state",
          OPENCLAW_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "grokbot-gateway",
        windowsTaskName: "GrokBot Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /Users/test/Library/Logs/grokbot/gateway.log",
      "Launchd stderr (if installed): suppressed",
      "Restart attempts: /tmp/grokbot-state/logs/gateway-restart.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        env: {
          OPENCLAW_STATE_DIR: "/tmp/grokbot-state",
        },
        systemdServiceName: "grokbot-gateway",
        windowsTaskName: "GrokBot Gateway",
      }),
    ).toEqual([
      "Logs: journalctl --user -u grokbot-gateway.service -n 200 --no-pager",
      "Restart attempts: /tmp/grokbot-state/logs/gateway-restart.log",
    ]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        env: {
          OPENCLAW_STATE_DIR: "/tmp/grokbot-state",
        },
        systemdServiceName: "grokbot-gateway",
        windowsTaskName: "GrokBot Gateway",
      }),
    ).toEqual([
      'Logs: schtasks /Query /TN "GrokBot Gateway" /V /FO LIST',
      "Restart attempts: /tmp/grokbot-state/logs/gateway-restart.log",
    ]);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "grokbot gateway install",
        startCommand: "grokbot gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.grokbot.gateway.plist",
        systemdServiceName: "grokbot-gateway",
        windowsTaskName: "GrokBot Gateway",
      }),
    ).toEqual([
      "grokbot gateway install",
      "grokbot gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.grokbot.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "grokbot gateway install",
        startCommand: "grokbot gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.grokbot.gateway.plist",
        systemdServiceName: "grokbot-gateway",
        windowsTaskName: "GrokBot Gateway",
      }),
    ).toEqual([
      "grokbot gateway install",
      "grokbot gateway",
      "systemctl --user start grokbot-gateway.service",
    ]);
  });
});
