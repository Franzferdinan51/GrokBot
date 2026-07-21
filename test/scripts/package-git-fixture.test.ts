// Package git fixture tests cover package-derived Docker git install fixtures.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

describe("package git fixture", () => {
  const tempDirs = useAutoCleanupTempDirTracker(afterEach);

  it("stages bundled ai runtime as a local file dependency", async () => {
    const root = tempDirs.make("grokbot-package-git-fixture-");
    mkdirSync(path.join(root, "node_modules", "@grokbot", "ai"), { recursive: true });
    writeFileSync(
      path.join(root, "package.json"),
      `${JSON.stringify(
        {
          dependencies: { "@grokbot/ai": "2026.6.11", chalk: "5.6.2" },
          bundleDependencies: ["@grokbot/ai", "chalk"],
        },
        null,
        2,
      )}\n`,
    );
    writeFileSync(path.join(root, "npm-shrinkwrap.json"), "{}\n");
    writeFileSync(
      path.join(root, "node_modules", "@grokbot", "ai", "package.json"),
      `${JSON.stringify({ name: "@grokbot/ai", version: "2026.6.11" })}\n`,
    );

    const result = spawnSync(
      process.execPath,
      ["scripts/e2e/lib/package-git-fixture.mjs", "prepare", root],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    expect(packageJson.dependencies["@grokbot/ai"]).toBe("file:.grokbot-fixture/packages/ai");
    expect(packageJson.bundleDependencies).toEqual(["chalk"]);
    expect(() => readFileSync(path.join(root, "npm-shrinkwrap.json"), "utf8")).toThrow();
    expect(
      JSON.parse(
        readFileSync(
          path.join(root, ".grokbot-fixture", "packages", "ai", "package.json"),
          "utf8",
        ),
      ).name,
    ).toBe("@grokbot/ai");
  });
});
