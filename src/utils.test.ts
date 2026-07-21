// Tests shared utility helpers used by CLI and runtime modules.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { MAX_TIMER_TIMEOUT_MS } from "./shared/number-coercion.js";
import { withTempDir } from "./test-helpers/temp-dir.js";
import { withEnv } from "./test-utils/env.js";
import {
  CONFIG_DIR,
  ensureDir,
  normalizeE164,
  pinConfigDir,
  resolveConfigDir,
  resolveHomeDir,
  resolveUserPath,
  shortenHomeInString,
  shortenHomePath,
  sleep,
} from "./utils.js";

describe("ensureDir", () => {
  it("creates nested directory", async () => {
    await withTempDir({ prefix: "grokbot-test-" }, async (tmp) => {
      const target = path.join(tmp, "nested", "dir");
      await ensureDir(target);
      expect(fs.existsSync(target)).toBe(true);
    });
  });
});

describe("sleep", () => {
  it("resolves after delay using fake timers", async () => {
    vi.useFakeTimers();
    try {
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("clamps oversized sleep delays before scheduling", async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    try {
      const promise = sleep(Number.MAX_SAFE_INTEGER);

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), MAX_TIMER_TIMEOUT_MS);

      vi.advanceTimersByTime(MAX_TIMER_TIMEOUT_MS);
      await expect(promise).resolves.toBeUndefined();
    } finally {
      setTimeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});

describe("normalizeE164", () => {
  it.each([
    ["+1234567890", "+1234567890"],
    ["++1234567890", "+1234567890"],
    ["1+234+567", "+1234567"],
    ["whatsapp:+1 (234) 567-8900", "+12345678900"],
    ["signal: 1 234 567", "+1234567"],
    ["not a phone number", ""],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeE164(input)).toBe(expected);
  });
});

describe("resolveConfigDir", () => {
  it("prefers ~/.grokbot when legacy dir is missing", async () => {
    await withTempDir({ prefix: "grokbot-config-dir-" }, async (root) => {
      const newDir = path.join(root, ".grokbot");
      await fs.promises.mkdir(newDir, { recursive: true });
      const resolved = resolveConfigDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(newDir);
    });
  });

  it("expands OPENCLAW_STATE_DIR using the provided env", () => {
    const env = {
      HOME: "/tmp/grokbot-home",
      OPENCLAW_STATE_DIR: "~/state",
    } as NodeJS.ProcessEnv;

    expect(resolveConfigDir(env)).toBe(path.resolve("/tmp/grokbot-home", "state"));
  });

  it("falls back to the config file directory when only OPENCLAW_CONFIG_PATH is set", () => {
    const env = {
      HOME: "/tmp/grokbot-home",
      OPENCLAW_CONFIG_PATH: "~/profiles/dev/grokbot.json",
    } as NodeJS.ProcessEnv;

    expect(resolveConfigDir(env)).toBe(path.resolve("/tmp/grokbot-home", "profiles", "dev"));
  });

  it("re-pins the exported configuration root after startup environment selection", () => {
    const originalConfigDir = CONFIG_DIR;
    const selectedConfigDir = path.resolve("/tmp/grokbot-selected-config-root");
    try {
      expect(
        pinConfigDir({
          OPENCLAW_STATE_DIR: selectedConfigDir,
          OPENCLAW_TEST_FAST: "1",
        }),
      ).toBe(selectedConfigDir);
      expect(CONFIG_DIR).toBe(selectedConfigDir);
    } finally {
      pinConfigDir({
        OPENCLAW_STATE_DIR: originalConfigDir,
        OPENCLAW_TEST_FAST: "1",
      });
    }
  });
});

describe("resolveHomeDir", () => {
  it("prefers OPENCLAW_HOME over HOME", () => {
    withEnv({ OPENCLAW_HOME: "/srv/grokbot-home", HOME: "/home/other" }, () => {
      expect(resolveHomeDir()).toBe(path.resolve("/srv/grokbot-home"));
    });
  });
});

describe("shortenHomePath", () => {
  it("uses $OPENCLAW_HOME prefix when OPENCLAW_HOME is set", () => {
    withEnv({ OPENCLAW_HOME: "/srv/grokbot-home", HOME: "/home/other" }, () => {
      expect(shortenHomePath(`${path.resolve("/srv/grokbot-home")}/.grokbot/grokbot.json`)).toBe(
        "$OPENCLAW_HOME/.grokbot/grokbot.json",
      );
    });
  });
});

describe("shortenHomeInString", () => {
  it("uses $OPENCLAW_HOME replacement when OPENCLAW_HOME is set", () => {
    withEnv({ OPENCLAW_HOME: "/srv/grokbot-home", HOME: "/home/other" }, () => {
      expect(
        shortenHomeInString(
          `config: ${path.resolve("/srv/grokbot-home")}/.grokbot/grokbot.json`,
        ),
      ).toBe("config: $OPENCLAW_HOME/.grokbot/grokbot.json");
    });
  });
});

describe("resolveUserPath", () => {
  it("expands ~ to home dir", () => {
    expect(resolveUserPath("~", {}, () => "/Users/thoffman")).toBe(path.resolve("/Users/thoffman"));
  });

  it("expands ~/ to home dir", () => {
    expect(resolveUserPath("~/grokbot", {}, () => "/Users/thoffman")).toBe(
      path.resolve("/Users/thoffman", "grokbot"),
    );
  });

  it("resolves relative paths", () => {
    expect(resolveUserPath("tmp/dir")).toBe(path.resolve("tmp/dir"));
  });

  it("prefers OPENCLAW_HOME for tilde expansion", () => {
    withEnv({ OPENCLAW_HOME: "/srv/grokbot-home", HOME: "/home/other" }, () => {
      expect(resolveUserPath("~/grokbot")).toBe(path.resolve("/srv/grokbot-home", "grokbot"));
    });
  });

  it("uses the provided env for tilde expansion", () => {
    const env = {
      HOME: "/tmp/grokbot-home",
      OPENCLAW_HOME: "/srv/grokbot-home",
    } as NodeJS.ProcessEnv;

    expect(resolveUserPath("~/grokbot", env)).toBe(path.resolve("/srv/grokbot-home", "grokbot"));
  });

  it("keeps blank paths blank", () => {
    expect(resolveUserPath("")).toBe("");
    expect(resolveUserPath("   ")).toBe("");
  });

  it("returns empty string for undefined/null input", () => {
    expect(resolveUserPath(undefined as unknown as string)).toBe("");
    expect(resolveUserPath(null as unknown as string)).toBe("");
  });
});
