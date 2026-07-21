// Profile CLI tests cover profile selection, persistence, and command wiring.
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "grokbot",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "grokbot", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("leaves gateway --dev for subcommands after leading root options", () => {
    const res = parseCliProfileArgs([
      "node",
      "grokbot",
      "--no-color",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual([
      "node",
      "grokbot",
      "--no-color",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "grokbot", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "grokbot", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "grokbot", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "grokbot", "status"]);
  });

  it("parses interleaved --profile after the command token", () => {
    const res = parseCliProfileArgs(["node", "grokbot", "status", "--profile", "work", "--deep"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "grokbot", "status", "--deep"]);
  });

  it("preserves Matrix QA --profile for the command parser", () => {
    const res = parseCliProfileArgs([
      "node",
      "grokbot",
      "qa",
      "matrix",
      "--profile",
      "fast",
      "--fail-fast",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual([
      "node",
      "grokbot",
      "qa",
      "matrix",
      "--profile",
      "fast",
      "--fail-fast",
    ]);
  });

  it("preserves Matrix QA --profile after leading root options", () => {
    const res = parseCliProfileArgs([
      "node",
      "grokbot",
      "--no-color",
      "qa",
      "matrix",
      "--profile=fast",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "grokbot", "--no-color", "qa", "matrix", "--profile=fast"]);
  });

  it("parses qa run --profile smoke-ci as a root profile", () => {
    const res = parseCliProfileArgs([
      "node",
      "grokbot",
      "qa",
      "run",
      "--profile",
      "smoke-ci",
      "--category",
      "agent-runtime-and-provider-execution.agent-turn-execution",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("smoke-ci");
    expect(res.argv).toEqual([
      "node",
      "grokbot",
      "qa",
      "run",
      "--category",
      "agent-runtime-and-provider-execution.agent-turn-execution",
    ]);
  });

  it("parses qa run --profile=release self-check invocations as root profiles", () => {
    const res = parseCliProfileArgs([
      "node",
      "grokbot",
      "qa",
      "run",
      "--profile=release",
      "--output",
      "qa-report.md",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("release");
    expect(res.argv).toEqual(["node", "grokbot", "qa", "run", "--output", "qa-report.md"]);
  });

  it("preserves qa run --qa-profile for the command parser", () => {
    const res = parseCliProfileArgs([
      "node",
      "grokbot",
      "qa",
      "run",
      "--qa-profile",
      "smoke-ci",
      "--surface",
      "agent-runtime-and-provider-execution",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual([
      "node",
      "grokbot",
      "qa",
      "run",
      "--qa-profile",
      "smoke-ci",
      "--surface",
      "agent-runtime-and-provider-execution",
    ]);
  });

  it("parses arbitrary qa run --profile values as root profiles", () => {
    const res = parseCliProfileArgs([
      "node",
      "grokbot",
      "qa",
      "run",
      "--profile",
      "work",
      "--output",
      "qa-report.md",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "grokbot", "qa", "run", "--output", "qa-report.md"]);
  });

  it("parses arbitrary qa run --profile= values as root profiles", () => {
    const res = parseCliProfileArgs([
      "node",
      "grokbot",
      "qa",
      "run",
      "--profile=work",
      "--output",
      "qa-report.md",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "grokbot", "qa", "run", "--output", "qa-report.md"]);
  });

  it("still parses root --profile before qa run", () => {
    const res = parseCliProfileArgs([
      "node",
      "grokbot",
      "--profile",
      "work",
      "qa",
      "run",
      "--qa-profile",
      "smoke-ci",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "grokbot", "qa", "run", "--qa-profile", "smoke-ci"]);
  });

  it("still parses root --profile before Matrix QA", () => {
    const res = parseCliProfileArgs([
      "node",
      "grokbot",
      "--profile",
      "work",
      "qa",
      "matrix",
      "--fail-fast",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "grokbot", "qa", "matrix", "--fail-fast"]);
  });

  it("parses interleaved --dev after the command token", () => {
    const res = parseCliProfileArgs(["node", "grokbot", "status", "--dev"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "grokbot", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "grokbot", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "grokbot", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "grokbot", "--profile", "work", "--dev", "status"]],
    ["interleaved after command", ["node", "grokbot", "status", "--profile", "work", "--dev"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".grokbot-dev");
    expect(env.OPENCLAW_PROFILE).toBe("dev");
    expect(env.OPENCLAW_STATE_DIR).toBe(expectedStateDir);
    expect(env.OPENCLAW_CONFIG_PATH).toBe(path.join(expectedStateDir, "grokbot.json"));
    expect(env.OPENCLAW_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      OPENCLAW_PROFILE: "prod",
      OPENCLAW_STATE_DIR: "/custom",
      OPENCLAW_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.OPENCLAW_PROFILE).toBe("dev");
    expect(env.OPENCLAW_STATE_DIR).toBe("/custom");
    expect(env.OPENCLAW_GATEWAY_PORT).toBe("19099");
    expect(env.OPENCLAW_CONFIG_PATH).toBe(path.join("/custom", "grokbot.json"));
  });

  it("uses OPENCLAW_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      OPENCLAW_HOME: "/srv/grokbot-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/grokbot-home");
    expect(env.OPENCLAW_STATE_DIR).toBe(path.join(resolvedHome, ".grokbot-work"));
    expect(env.OPENCLAW_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".grokbot-work", "grokbot.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "grokbot doctor --fix",
      env: {},
      expected: "grokbot doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "grokbot doctor --fix",
      env: { OPENCLAW_PROFILE: "default" },
      expected: "grokbot doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "grokbot doctor --fix",
      env: { OPENCLAW_PROFILE: "Default" },
      expected: "grokbot doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "grokbot doctor --fix",
      env: { OPENCLAW_PROFILE: "bad profile" },
      expected: "grokbot doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "grokbot --profile work doctor --fix",
      env: { OPENCLAW_PROFILE: "work" },
      expected: "grokbot --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "grokbot --dev doctor",
      env: { OPENCLAW_PROFILE: "dev" },
      expected: "grokbot --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("grokbot doctor --fix", { OPENCLAW_PROFILE: "work" })).toBe(
      "grokbot --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("grokbot doctor --fix", { OPENCLAW_PROFILE: "  jbopenclaw  " })).toBe(
      "grokbot --profile jbopenclaw doctor --fix",
    );
  });

  it("handles command with no args after grokbot", () => {
    expect(formatCliCommand("grokbot", { OPENCLAW_PROFILE: "test" })).toBe(
      "grokbot --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm grokbot doctor", { OPENCLAW_PROFILE: "work" })).toBe(
      "pnpm grokbot --profile work doctor",
    );
  });

  it("inserts --container when a container hint is set", () => {
    expect(
      formatCliCommand("grokbot gateway status --deep", { OPENCLAW_CONTAINER_HINT: "demo" }),
    ).toBe("grokbot --container demo gateway status --deep");
  });

  it("ignores unsafe container hints", () => {
    expect(
      formatCliCommand("grokbot gateway status --deep", {
        OPENCLAW_CONTAINER_HINT: "demo; rm -rf /",
      }),
    ).toBe("grokbot gateway status --deep");
  });

  it("preserves both --container and --profile hints", () => {
    expect(
      formatCliCommand("grokbot doctor", {
        OPENCLAW_CONTAINER_HINT: "demo",
        OPENCLAW_PROFILE: "work",
      }),
    ).toBe("grokbot --container demo doctor");
  });

  it("does not prepend --container for update commands", () => {
    expect(formatCliCommand("grokbot update", { OPENCLAW_CONTAINER_HINT: "demo" })).toBe(
      "grokbot update",
    );
    expect(
      formatCliCommand("pnpm grokbot update --channel beta", { OPENCLAW_CONTAINER_HINT: "demo" }),
    ).toBe("pnpm grokbot update --channel beta");
  });
});
