import { Application, Assets, Sprite } from "pixi.js";
import { Queue } from "./queue/model/queue";
import type { Item } from "./queue/model/utils";
import { createQueueView, type QueueView } from "./queue/view";
import { Layout, type Direction, type Pos } from "./queue/layout";
import { DEFAULT_CONFIG, Station, StationBoard } from "./station/station";
import { createStationView } from "./station/view";

const BOX = 36;
const GAP = 8;
const QUEUE_LENGTH = 5;
const EDIT_INTERVAL_MS = 700;

/** Where the four shared processing stations sit (item top-left, in stage coords) */
const STATION_POSITIONS: readonly Pos[] = [
  { x: 760, y: 120 },
  { x: 960, y: 120 },
  { x: 760, y: 300 },
  { x: 960, y: 300 },
];

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

/** One conveyor belt: a queue, its view, and where its head sits in stage coords */
type Conveyor = {
  readonly queue: Queue;
  readonly layout: Layout;
  readonly view: QueueView;
  readonly origin: Pos;
};

const createConveyor = (origin: Pos, direction: Direction): Conveyor => {
  const layout = new Layout(BOX, GAP, direction);
  const queue = new Queue();
  for (let i = 0; i < QUEUE_LENGTH; i++) queue.push(newItem());

  const view = createQueueView(layout);
  view.root.position.set(origin.x, origin.y);

  return { queue, layout, view, origin };
};

/** Stage-coords top-left of the head item's box, so a dispatch starts exactly where it sat */
const headBox = (c: Conveyor, size: number): Pos => {
  const o = c.layout.boxOrigin(c.layout.itemOffset(0, 0), size);
  return { x: c.origin.x + o.x, y: c.origin.y + o.y };
};

/** Push at the tail or pop the head into a station, keeping the length around QUEUE_LENGTH */
const randomEdit = (c: Conveyor, board: StationBoard, now: number) => {
  const q = c.queue;
  const n = q.items.length;
  const grow = n < QUEUE_LENGTH || (n === QUEUE_LENGTH && Math.random() < 0.5);
  if (grow) {
    q.push(newItem());
    return;
  }
  // Dispatch the head to a station; if every station is busy, leave the queue alone
  if (!board.hasFree) return;
  const item = q.pop(now);
  if (item !== undefined) board.dispatch(item, headBox(c, item.size), now);
};

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Load the bunny texture
  const texture = await Assets.load("/assets/bunny.png");

  const bunny = new Sprite(texture);
  bunny.anchor.set(0.5);
  bunny.position.set(app.screen.width / 2, app.screen.height / 2);
  app.stage.addChild(bunny);

  // Two left-to-right conveyor belts feeding one pool of stations. The head (exit) is on the
  // right, so the tail extends leftwards from each origin.
  const conveyors: Conveyor[] = [
    createConveyor({ x: 620, y: 60 }, "ltr"),
    createConveyor({ x: 620, y: 240 }, "ltr"),
  ];
  for (const c of conveyors) app.stage.addChild(c.view.root);

  const stations = STATION_POSITIONS.map((target) => new Station(target));
  const board = new StationBoard(stations);
  const stationView = createStationView(
    new Layout(BOX, GAP, "ltr"),
    DEFAULT_CONFIG,
  );
  app.stage.addChild(stationView.root);

  let lastEditAt = performance.now();
  app.ticker.add(() => {
    const now = performance.now();
    if (now - lastEditAt >= EDIT_INTERVAL_MS) {
      randomEdit(conveyors[randomInt(conveyors.length)], board, now);
      lastEditAt = now;
    }
    board.reap(now, DEFAULT_CONFIG);
    for (const c of conveyors) c.view.render(c.queue, now);
    stationView.render(stations, now);
  });

  // Listen for animate update
  app.ticker.add((time) => {
    // Just for fun, let's rotate mr rabbit a little.
    // * Delta is 1 if running at 100% performance, creates frame-independent transformation *
    bunny.rotation += 0.1 * time.deltaTime;
  });
})();
