// Text format tests cover command-facing shortening helpers.
import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("grokbot", 16)).toBe("grokbot");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("grokbot-status-output", 10)).toBe("grokbot-…");
  });

  it("returns an empty string for non-positive limits", () => {
    expect(shortenText("grokbot", 0)).toBe("");
    expect(shortenText("grokbot", -1)).toBe("");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
