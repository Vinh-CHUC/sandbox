import { Application } from "pixi.js";
import { ScreenPos, SimMs, WallMs, type Pos } from "./shared/common";
import { SimClock } from "./shared/clock";
import { GROUND } from "./shared/palette";
import { units } from "./shared/scale";
import { FLAT, type Projection } from "./shared/projection";
import { loadTrace, openUrl } from "./trace/load";
import type { Trace } from "./trace/trace";
import { World } from "./world";

/** 2:1 isometric; the offset keeps the (skewed) scene in view */
const ISO: Projection = {
  kind: "iso",
  scale: 0.7,
  offset: ScreenPos(units(12.5), -units(4.2)),
};

/** Playback speeds: a trace spans hours, so 60× (a minute per second) is the default */
const SPEEDS = [1, 10, 60, 300, 1200];
const INITIAL_SPEED = 60;

/** Where `data/` writes traces to; Vite serves `public/` as is */
const TRACE_URL = `${import.meta.env.BASE_URL}trace`;

const element = (id: string) => document.getElementById(id)!;

/** Wall-clock time of `t` simulated ms into the trace, e.g. "2026-01-01 03:12" (UTC) */
const clockTime = (trace: Trace, t: number) =>
  new Date(trace.startUnixMs + t).toISOString().slice(0, 16).replace("T", " ");

(async () => {
  const app = new Application();
  // Grey ground outside the sites; each site paints its own floor (see SiteView)
  await app.init({ background: GROUND, resizeTo: window });
  element("pixi-container").appendChild(app.canvas);

  let trace: Trace;
  try {
    trace = await loadTrace(openUrl(TRACE_URL));
  } catch (error) {
    // Most likely no trace yet: tell how to make one rather than showing an empty canvas
    element("time").textContent =
      `No trace at ${TRACE_URL} (run \`just trace\` in data/): ${String(error)}`;
    throw error;
  }

  const tooltip = element("tooltip");
  const world = new World(trace, {
    onHover: (text, at) => {
      tooltip.style.display = text === null ? "none" : "block";
      if (text === null) return;
      if (tooltip.textContent !== text) tooltip.textContent = text;
      // Just below-right of the pointer, so it doesn't sit under it
      tooltip.style.left = `${at.x + 12}px`;
      tooltip.style.top = `${at.y + 12}px`;
    },
  });
  app.stage.addChild(world.root);

  // Panning: drag anywhere to move the world around
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.canvas.style.cursor = "grab";
  let dragFrom: Pos | null = null;
  app.stage.on("pointerdown", (e) => {
    dragFrom = { x: e.global.x, y: e.global.y };
    app.canvas.style.cursor = "grabbing";
  });
  app.stage.on("globalpointermove", (e) => {
    if (dragFrom === null) return;
    world.panBy(ScreenPos(e.global.x - dragFrom.x, e.global.y - dragFrom.y));
    dragFrom = { x: e.global.x, y: e.global.y };
  });
  const endDrag = () => {
    dragFrom = null;
    app.canvas.style.cursor = "grab";
  };
  app.stage.on("pointerup", endDrag);
  app.stage.on("pointerupoutside", endDrag);
  // Zooming: explicit buttons, around the middle of the screen (the mouse wheel and pinch stay
  // the browser's); double-click resets pan and zoom
  const ZOOM_STEP = 1.25;
  const showZoom = () => {
    element("zoom").textContent = `${Math.round(world.zoom * 100)}%`;
  };
  const zoomAroundCentre = (factor: number) => {
    world.zoomBy(
      factor,
      ScreenPos(app.screen.width / 2, app.screen.height / 2),
    );
    showZoom();
  };
  element("zoom-in").addEventListener("click", () =>
    zoomAroundCentre(ZOOM_STEP),
  );
  element("zoom-out").addEventListener("click", () =>
    zoomAroundCentre(1 / ZOOM_STEP),
  );
  showZoom();
  app.canvas.addEventListener("dblclick", () => {
    world.resetView();
    showZoom();
  });

  const toggle = element("projection-toggle");
  const label = () => (world.projection.kind === "flat" ? "Isometric" : "Flat");
  toggle.textContent = label();
  toggle.addEventListener("click", () => {
    world.setProjection(world.projection.kind === "flat" ? ISO : FLAT);
    toggle.textContent = label();
  });

  // Simulated time: pause and speed controls only touch this clock
  const clock = new SimClock(SPEEDS, INITIAL_SPEED);
  const showClock = () => {
    element("pause").textContent = clock.paused ? "▶" : "⏸";
    element("speed").textContent = `${clock.speed}×`;
  };
  const onClick = (id: string, action: () => void) =>
    element(id).addEventListener("click", () => {
      action();
      showClock();
    });
  onClick("pause", () => clock.togglePause());
  onClick("slower", () => clock.slower());
  onClick("faster", () => clock.faster());
  showClock();

  // Throughput labels: which sliding window they average over
  const windowSelect = element("window") as HTMLSelectElement;
  const applyWindow = () =>
    world.setThroughputWindow(Number(windowSelect.value));
  windowSelect.addEventListener("change", applyWindow);
  applyWindow();

  const time = element("time");
  app.ticker.add((ticker) => {
    // Real frame time in, simulated time out, held at the trace's end
    const now = SimMs(Math.min(clock.advance(ticker.deltaMS), trace.endMs));
    if (now >= trace.endMs && !clock.paused) {
      clock.togglePause();
      showClock();
    }
    world.tick(now, WallMs(performance.now()));
    const shown = clockTime(trace, now);
    if (time.textContent !== shown) time.textContent = shown;
  });
})();
