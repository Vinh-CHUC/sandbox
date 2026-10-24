import { describe, expect, it } from "vitest";
import { naming, parseLabels } from "./naming";

const trace = { labels: new Map([["queues:2", "From the trace"]]) };

describe("naming", () => {
  it("labels.json first, then the trace's labels, then ‹Kind› ‹id›", () => {
    const n = naming(trace, {
      names: { queues: { "1": "Intake" }, skus: { "100": "bolt" } },
    });
    expect(n.name("queues", 1)).toBe("Intake");
    expect(n.name("queues", 2)).toBe("From the trace");
    expect(n.name("queues", 3)).toBe("Queue 3");
    expect(n.name("skus", 100)).toBe("bolt");
  });

  it("kinds rename the fallbacks too", () => {
    const n = naming(trace, {
      kinds: { station: { one: "Bench", many: "Benches" } },
    });
    expect(n.name("stations", 4)).toBe("Bench 4");
    expect(n.kind("station").many).toBe("Benches");
    expect(n.kind("item").one).toBe("Item"); // untouched kinds keep their default
  });

  it("states and KPI captions, with defaults", () => {
    const n = naming(trace, {
      states: { "1": "short of parts" },
      captions: { done: "Shipped" },
    });
    expect([n.state(0), n.state(1), n.state(7)]).toEqual([
      "waiting",
      "short of parts",
      "state 7",
    ]);
    expect(n.caption("done", "Done")).toBe("Shipped");
    expect(n.caption("waiting", "Waiting")).toBe("Waiting");
  });
});

describe("parseLabels", () => {
  it("accepts the documented shape", () => {
    const file = {
      kinds: { item: { one: "Widget", many: "Widgets" } },
      names: { sites: { "1": "North" } },
    };
    expect(parseLabels(file)).toEqual(file);
  });

  it("says what's wrong", () => {
    expect(() => parseLabels([])).toThrow("not an object");
    expect(() => parseLabels({ nicknames: {} })).toThrow(
      'unknown key "nicknames"',
    );
    expect(() => parseLabels({ kinds: { item: { one: "Widget" } } })).toThrow(
      '"kinds"',
    );
    expect(() => parseLabels({ names: { sites: { "1": 2 } } })).toThrow(
      '"names"',
    );
  });
});
