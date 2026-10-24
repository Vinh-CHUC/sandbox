import { Application } from "pixi.js";
import {
  PartId,
  ScreenPos,
  WorldPos,
  type Item,
  type PartRequest,
  type PartType,
} from "./shared/common";
import { SimClock } from "./shared/clock";
import { FLAT, type Projection } from "./shared/projection";
import { BoardId, ConveyorId, World, type WorldSpec } from "./world";

const EDIT_INTERVAL_MS = 400;

/** 2:1 isometric; the offset keeps the (skewed) scene in view */
const ISO: Projection = {
  kind: "iso",
  scale: 0.7,
  offset: ScreenPos(250, -100),
};

const PART_TYPES: readonly PartType[] = [
  { id: PartId("wheel"), color: 0x2c3e50 },
  { id: PartId("seat"), color: 0x9b59b6 },
  { id: PartId("engine"), color: 0xe67e22 },
  { id: PartId("door"), color: 0x1abc9c },
  { id: PartId("light"), color: 0xf1c40f },
];

const C1 = ConveyorId("C1");
const C2 = ConveyorId("C2");
const S1 = BoardId("S1");
const S2 = BoardId("S2");

// C1 → S1 → C2 → S2, left to right. Conveyors have their head (exit) on the right, so their
// tails extend leftwards from each origin; stations are stacked around each conveyor's axis.
const SPEC: WorldSpec = {
  conveyors: [
    { id: C1, origin: WorldPos(600, 240), direction: "ltr" },
    { id: C2, origin: WorldPos(1400, 240), direction: "ltr" },
  ],
  boards: [
    {
      id: S1,
      // item top-left, in stage coords
      positions: [WorldPos(720, 100), WorldPos(720, 240), WorldPos(720, 380)],
    },
    {
      id: S2,
      positions: [
        WorldPos(1520, 100),
        WorldPos(1520, 240),
        WorldPos(1520, 380),
      ],
    },
  ],
  // Below the stations, between S1 and S2: it supplies both
  inventory: { origin: WorldPos(1000, 520), parts: PART_TYPES, capacity: 100 },
  edges: [
    { from: { kind: "queue", id: C1 }, to: { kind: "stations", id: S1 } },
    { from: { kind: "stations", id: S1 }, to: { kind: "queue", id: C2 } },
    { from: { kind: "queue", id: C2 }, to: { kind: "stations", id: S2 } },
  ],
};

const randomColor = () => Math.floor(Math.random() * 0xffffff);
const randomInt = (n: number) => Math.floor(Math.random() * n);
const randomSize = () => 1 + randomInt(3); // 1..3 boxes wide
const randomProcessMs = () => 1000 + randomInt(2000);

let nextId = 0;
const newItem = (): Item => ({
  id: nextId++,
  color: randomColor(),
  size: randomSize(),
  processMs: randomProcessMs(),
});

/** 2 or 3 distinct parts, 1 to 3 of each */
const pickParts = (parts: readonly PartId[]): PartRequest => {
  const shuffled = [...parts].sort(() => Math.random() - 0.5);
  return shuffled
    .slice(0, 2 + randomInt(2))
    .map((part) => ({ part, count: 1 + randomInt(3) }));
};

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  const world = new World(SPEC, { newItem, pickParts });
  app.stage.addChild(world.root);

  const toggle = document.getElementById("projection-toggle")!;
  const label = () => (world.projection.kind === "flat" ? "Isometric" : "Flat");
  toggle.textContent = label();
  toggle.addEventListener("click", () => {
    world.setProjection(world.projection.kind === "flat" ? ISO : FLAT);
    toggle.textContent = label();
  });

  // Simulated time: pause and speed controls only touch this clock
  const clock = new SimClock();
  const button = (id: string) => document.getElementById(id)!;
  const showClock = () => {
    button("pause").textContent = clock.paused ? "▶" : "⏸";
    button("speed").textContent = `${clock.speed}×`;
  };
  const onClick = (id: string, action: () => void) =>
    button(id).addEventListener("click", () => {
      action();
      showClock();
    });
  onClick("pause", () => clock.togglePause());
  onClick("slower", () => clock.slower());
  onClick("faster", () => clock.faster());
  showClock();

  let lastEditAt = clock.now;
  app.ticker.add((ticker) => {
    // Real frame time in, simulated time out: everything below runs on the latter
    const now = clock.advance(ticker.deltaMS);
    if (now - lastEditAt >= EDIT_INTERVAL_MS) {
      world.randomEdit(now);
      lastEditAt = now;
    }
    world.tick(now);
  });
})();
