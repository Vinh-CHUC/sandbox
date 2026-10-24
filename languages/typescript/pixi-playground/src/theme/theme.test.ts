import { describe, expect, it } from "vitest";
import { faceUrls, parseTheme, themeUrl } from "./theme";

describe("themeUrl", () => {
  it.each([
    ["", "/theme.json"],
    ["?theme=", "/theme.json"],
    ["?theme=rts", "/themes/rts/theme.json"],
    ["?speed=2&theme=a b", "/themes/a%20b/theme.json"],
  ])("%j → %s", (search, expected) => {
    expect(themeUrl("/", search)).toBe(expected);
  });
});

describe("faceUrls", () => {
  const base = "http://x/themes/t/theme.json";
  it.each([
    [{ top: "a.svg" }, ["a.svg", "a.svg", "a.svg"]],
    [{ top: "a.svg", side: "b.svg" }, ["a.svg", "b.svg", "b.svg"]],
    [
      { top: "a.svg", side: "b.svg", end: "c.svg" },
      ["a.svg", "b.svg", "c.svg"],
    ],
    [
      { top: "../shared/a.svg" },
      ["../shared/a.svg", "../shared/a.svg", "../shared/a.svg"],
    ],
  ])("%o: side defaults to top, end to side", (urls, [top, side, end]) => {
    expect(faceUrls(urls, base)).toEqual({
      top: new URL(top, base).href,
      side: new URL(side, base).href,
      end: new URL(end, base).href,
    });
  });
});

describe("parseTheme", () => {
  it("accepts a well-formed theme", () => {
    const json = {
      item_types: { "1": { top: "t.svg", side: "s.svg", end: "e.svg" } },
      skus: { "100": { top: "crate.svg" } },
    };
    expect(parseTheme(json)).toEqual(json);
  });

  it.each([
    [[], /not an object/],
    [{ vehicles: {} }, /unknown key "vehicles"/],
    [{ skus: { "1": { side: "s.svg" } } }, /"skus" isn't shaped/], // no top
    [{ skus: { "1": { top: 3 } } }, /"skus" isn't shaped/],
    [{ item_types: { "1": { top: "t.svg", back: "b.svg" } } }, /"item_types"/],
  ])("rejects %j", (json, message) => {
    expect(() => parseTheme(json)).toThrow(message);
  });
});
