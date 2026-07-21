// Tests gateway process argv parsing for diagnostics.
import { describe, expect, it } from "vitest";
import { isGatewayArgv, isOpenClawCommandArgv, parseProcCmdline } from "./gateway-process-argv.js";

describe("parseProcCmdline", () => {
  it("splits null-delimited argv and trims empty entries", () => {
    expect(parseProcCmdline(" node \0 gateway \0\0 --port \0 18789 \0")).toEqual([
      "node",
      "gateway",
      "--port",
      "18789",
    ]);
  });

  it("keeps non-delimited single arguments and drops whitespace-only entries", () => {
    expect(parseProcCmdline(" gateway ")).toEqual(["gateway"]);
    expect(parseProcCmdline(" \0\t\0 ")).toStrictEqual([]);
  });
});

describe("isGatewayArgv", () => {
  it("requires a gateway token", () => {
    expect(isGatewayArgv(["node", "dist/index.js", "--port", "18789"])).toBe(false);
  });

  it("matches known entrypoints across slash and case variants", () => {
    expect(isGatewayArgv(["NODE", "C:\\GrokBot\\DIST\\ENTRY.JS", "gateway"])).toBe(true);
    expect(isGatewayArgv(["bun", "/srv/grokbot/scripts/run-node.mjs", "gateway"])).toBe(true);
    expect(isGatewayArgv(["node", "/srv/grokbot/grokbot.mjs", "gateway"])).toBe(true);
    expect(isGatewayArgv(["tsx", "/srv/grokbot/src/entry.ts", "gateway"])).toBe(true);
    expect(isGatewayArgv(["tsx", "/srv/grokbot/src/index.ts", "gateway"])).toBe(true);
  });

  it("matches the grokbot executable but gates the gateway binary behind the opt-in flag", () => {
    expect(isGatewayArgv(["C:\\bin\\grokbot.cmd", "gateway"])).toBe(true);
    expect(isGatewayArgv(["/usr/local/bin/grokbot-gateway", "gateway"])).toBe(false);
    expect(isGatewayArgv(["grokbot-gateway"])).toBe(false);
    expect(
      isGatewayArgv(["/usr/local/bin/grokbot-gateway", "gateway"], {
        allowGatewayBinary: true,
      }),
    ).toBe(true);
    expect(
      isGatewayArgv(["C:\\bin\\grokbot-gateway.EXE", "gateway"], {
        allowGatewayBinary: true,
      }),
    ).toBe(true);
    expect(isGatewayArgv(["grokbot-gateway"], { allowGatewayBinary: true })).toBe(true);
  });

  it("rejects unknown gateway argv even when the token is present", () => {
    expect(isGatewayArgv(["node", "/srv/grokbot/custom.js", "gateway"])).toBe(false);
    expect(isGatewayArgv(["python", "gateway", "script.py"])).toBe(false);
  });
});

describe("isOpenClawCommandArgv", () => {
  it("matches doctor across source, built, and installed entrypoints", () => {
    expect(isOpenClawCommandArgv(["node", "/srv/grokbot/grokbot.mjs", "doctor"], "doctor")).toBe(
      true,
    );
    expect(
      isOpenClawCommandArgv(["NODE", "C:\\GrokBot\\DIST\\ENTRY.JS", "DOCTOR"], "doctor"),
    ).toBe(true);
    expect(isOpenClawCommandArgv(["C:\\bin\\grokbot.cmd", "doctor", "--fix"], "doctor")).toBe(
      true,
    );
  });

  it("rejects other GrokBot commands and unrelated doctor processes", () => {
    expect(isOpenClawCommandArgv(["grokbot", "gateway"], "doctor")).toBe(false);
    expect(isOpenClawCommandArgv(["python", "doctor", "worker.py"], "doctor")).toBe(false);
  });
});
