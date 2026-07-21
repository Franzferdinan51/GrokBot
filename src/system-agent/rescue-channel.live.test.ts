// GrokBot live rescue channel tests cover live-channel rescue message delivery.
import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { CommandContext } from "../auto-reply/reply/commands-types.js";
import { clearConfigCache } from "../config/config.js";
import type { OpenClawConfig } from "../config/types.grokbot.js";
import { resetPluginStateStoreForTests } from "../plugin-state/plugin-state-store.js";
import { withTempDir } from "../test-helpers/temp-dir.js";
import { deleteTestEnvValue, setTestEnvValue } from "../test-utils/env.js";
import { listSystemAgentAuditEntriesForTests } from "./audit.test-support.js";
import { runSystemAgentRescueMessage } from "./rescue-message.js";

const originalStateDir = process.env.OPENCLAW_STATE_DIR;
const originalConfigPath = process.env.OPENCLAW_CONFIG_PATH;

function truthy(value: string | undefined): boolean {
  return /^(1|true|yes|on)$/i.test(value?.trim() ?? "");
}

const runLive =
  truthy(process.env.OPENCLAW_LIVE_TEST) &&
  truthy(process.env.OPENCLAW_LIVE_SYSTEM_AGENT_RESCUE_CHANNEL);
const describeLive = runLive ? describe : describe.skip;

function commandContext(channel = process.env.OPENCLAW_LIVE_SYSTEM_AGENT_CHANNEL ?? "whatsapp") {
  return {
    surface: channel,
    channel,
    channelId: channel,
    ownerList: ["user:owner"],
    senderIsOwner: true,
    isAuthorizedSender: true,
    senderId: "user:owner",
    rawBodyNormalized: "/grokbot status",
    commandBodyNormalized: "/grokbot status",
    from: "user:owner",
    to: "account:default",
  } satisfies CommandContext;
}

async function runRescue(params: {
  commandBody: string;
  cfg: OpenClawConfig;
  ctx?: CommandContext;
}) {
  const ctx = params.ctx ?? commandContext();
  return await runSystemAgentRescueMessage({
    cfg: params.cfg,
    command: { ...ctx, commandBodyNormalized: params.commandBody },
    commandBody: params.commandBody,
    isGroup: false,
  });
}

describeLive("GrokBot live rescue channel smoke", () => {
  afterEach(() => {
    resetPluginStateStoreForTests();
    clearConfigCache();
    if (originalStateDir === undefined) {
      deleteTestEnvValue("OPENCLAW_STATE_DIR");
    } else {
      setTestEnvValue("OPENCLAW_STATE_DIR", originalStateDir);
    }
    if (originalConfigPath === undefined) {
      deleteTestEnvValue("OPENCLAW_CONFIG_PATH");
    } else {
      setTestEnvValue("OPENCLAW_CONFIG_PATH", originalConfigPath);
    }
  });

  it("handles /grokbot status and a persistent approval roundtrip", async () => {
    await withTempDir({ prefix: "grokbot-live-rescue-" }, async (tempDir) => {
      const configPath = path.join(tempDir, "grokbot.json");
      setTestEnvValue("OPENCLAW_STATE_DIR", tempDir);
      setTestEnvValue("OPENCLAW_CONFIG_PATH", configPath);
      await fs.writeFile(
        configPath,
        JSON.stringify(
          {
            meta: { lastTouchedVersion: "live-test", lastTouchedAt: new Date(0).toISOString() },
            agents: { defaults: {} },
            tools: { exec: { security: "full", ask: "off" } },
          },
          null,
          2,
        ),
      );

      const cfg: OpenClawConfig = {
        systemAgent: { rescue: { enabled: true } },
        tools: { exec: { security: "full", ask: "off" } },
      };

      await expect(runRescue({ commandBody: "/grokbot status", cfg })).resolves.toContain(
        "[grokbot] done: status.check",
      );
      await expect(
        runRescue({ commandBody: "/grokbot set default model openai/gpt-5.5", cfg }),
      ).resolves.toContain("Reply /grokbot yes to apply");
      await expect(runRescue({ commandBody: "/grokbot yes", cfg })).resolves.toContain(
        "Default model: openai/gpt-5.5",
      );

      const config = JSON.parse(await fs.readFile(configPath, "utf8")) as OpenClawConfig;
      const defaultModel = config.agents?.defaults?.model;
      if (!defaultModel || typeof defaultModel !== "object") {
        throw new Error("expected default model object");
      }
      expect(defaultModel.primary).toBe("openai/gpt-5.5");
      expect(
        listSystemAgentAuditEntriesForTests().some(
          (entry) => entry.value.operation === "config.setDefaultModel",
        ),
      ).toBe(true);
    });
  });
});
