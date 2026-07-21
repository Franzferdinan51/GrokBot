// Check Plugin Sdk Wildcard Reexports tests cover check plugin sdk wildcard reexports script behavior.
import { describe, expect, it } from "vitest";
import { findPluginSdkWildcardReexports } from "../../scripts/check-plugin-sdk-wildcard-reexports.mjs";

describe("check-plugin-sdk-wildcard-reexports", () => {
  it("flags wildcard re-exports from plugin-sdk subpaths", () => {
    expect(
      findPluginSdkWildcardReexports(
        [
          'export * from "grokbot/plugin-sdk/foo";',
          'export * as sdk from "grokbot/plugin-sdk/foo";',
          'export type * from "grokbot/plugin-sdk/bar";',
          'export type * as sdkTypes from "grokbot/plugin-sdk/bar";',
          'export { named } from "grokbot/plugin-sdk/foo";',
        ].join("\n"),
      ),
    ).toEqual([
      { line: 1, text: 'export * from "grokbot/plugin-sdk/foo";' },
      { line: 2, text: 'export * as sdk from "grokbot/plugin-sdk/foo";' },
      { line: 3, text: 'export type * from "grokbot/plugin-sdk/bar";' },
      { line: 4, text: 'export type * as sdkTypes from "grokbot/plugin-sdk/bar";' },
    ]);
  });

  it("allows explicit SDK exports and local wildcard barrels", () => {
    expect(
      findPluginSdkWildcardReexports(
        [
          'export { named } from "grokbot/plugin-sdk/foo";',
          'export type { Named } from "grokbot/plugin-sdk/foo";',
          'export * from "./src/runtime-api.js";',
          'export * as runtime from "./src/runtime-api.js";',
        ].join("\n"),
      ),
    ).toStrictEqual([]);
  });
});
