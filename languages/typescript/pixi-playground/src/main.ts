import { Application } from "pixi.js";
import type { Item } from "./shared/common";
import { BoardId, ConveyorId, World, type WorldSpec } from "./world";

const EDIT_INTERVAL_MS = 400;

const C1 = ConveyorId("C1");
const C2 = ConveyorId("C2");
const S1 = BoardId("S1");
const S2 = BoardId("S2");

// C1 → S1 → C2 → S2, left to right. Conveyors have their head (exit) on the right, so their
// tails extend leftwards from each origin; stations are stacked around each conveyor's axis.
const SPEC: WorldSpec = {
  conveyors: [
    { id: C1, origin: { x: 600, y: 240 }, direction: "ltr" },
    { id: C2, origin: { x: 1400, y: 240 }, direction: "ltr" },
  ],
  boards: [
    {
      id: S1,
      // item top-left, in stage coords
      positions: [
        { x: 720, y: 100 },
        { x: 720, y: 240 },
        { x: 720, y: 380 },
      ],
    },
    {
      id: S2,
      positions: [
        { x: 1520, y: 100 },
        { x: 1520, y: 240 },
        { x: 1520, y: 380 },
      ],
    },
  ],
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

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  const world = new World(SPEC, newItem);
  for (const container of world.containers) app.stage.addChild(container);

  let lastEditAt = performance.now();
  app.ticker.add(() => {
    const now = performance.now();
    if (now - lastEditAt >= EDIT_INTERVAL_MS) {
      world.randomEdit(now);
      lastEditAt = now;
    }
    world.tick(now);
  });
})();
