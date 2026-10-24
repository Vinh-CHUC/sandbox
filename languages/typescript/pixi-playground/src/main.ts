import { Application, Point } from "pixi.js";
import { ScreenPos, SimMs, WallMs, type Pos } from "./shared/common";
import { SimClock } from "./shared/clock";
import { GROUND } from "./shared/palette";
import { FLAT, type Projection } from "./shared/projection";
import { kpiTiles, type Tile } from "./kpis";
import { RATE_REFRESH_MS, throttle } from "./shared/draw";
import { loadTrace, openUrl } from "./trace/load";
import { fetchLabels, type LabelsFile } from "./trace/naming";
import {
  fetchTheme,
  loadSkins,
  NO_SKINS,
  themeUrl,
  type Skins,
} from "./theme/theme";
import type { Trace } from "./trace/trace";
import { World } from "./world";

/** The views on offer, by the value of their option in the "View" dropdown */
const PROJECTIONS: Record<string, Projection> = {
  flat: FLAT,
  dimetric: { kind: "dimetric", scale: 0.7 },
  isometric: { kind: "isometric", scale: 0.8 },
  trimetric: { kind: "trimetric", scale: 0.8 },
};

/** Playback speeds: a trace spans hours, so 60× (a minute per second) is the default */
const SPEEDS = [1, 10, 60, 300, 1200];
const INITIAL_SPEED = 60;

/** Where `data/` writes traces to; Vite serves `public/` as is */
const TRACE_URL = `${import.meta.env.BASE_URL}trace`;
/** Display names, kept out of the repo (git-ignored): see labels.example.json */
const LABELS_URL = `${import.meta.env.BASE_URL}labels.json`;
/** Sprites for the boxes, also git-ignored: `?theme=<name>` picks one of `public/themes/` */
const THEME_URL = new URL(
  themeUrl(import.meta.env.BASE_URL, location.search),
  location.href,
).href;
/** The themes on offer in the "Theme" dropdown: a JSON list of names, written with the themes */
const THEMES_URL = `${import.meta.env.BASE_URL}themes/index.json`;

/** List the themes in `select` (the current one selected); picking one reloads with it */
const offerThemes = async (select: HTMLSelectElement) => {
  const response = await fetch(THEMES_URL);
  const names: unknown = response.ok ? await response.json() : [];
  if (!Array.isArray(names) || names.length === 0) return;
  const current = new URLSearchParams(location.search).get("theme") ?? "";
  for (const name of names.map(String))
    select.append(new Option(name, name, false, name === current));
  select.value = current;
  select.closest("label")?.classList.remove("hidden");
  select.addEventListener("change", () => {
    const params = new URLSearchParams(location.search);
    if (select.value === "") params.delete("theme");
    else params.set("theme", select.value);
    location.search = params.toString();
  });
};

/** Show `tiles` in `strip`: one element per KPI, created once, then only their text changes */
const showTiles = (strip: HTMLElement, tiles: readonly Tile[]) => {
  for (const tile of tiles) {
    let el = strip.querySelector<HTMLElement>(`[data-kpi="${tile.id}"]`);
    if (el === null) {
      el = document.createElement("div");
      el.dataset.kpi = tile.id;
      el.className = "kpi";
      el.append(
        document.createElement("strong"),
        document.createElement("span"),
      );
      strip.append(el);
    }
    const [value, caption] = el.children;
    if (value.textContent !== tile.value) value.textContent = tile.value;
    if (caption.textContent !== tile.caption)
      caption.textContent = tile.caption;
    el.classList.toggle("alert", tile.alert);
  }
};

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
  // Optional: without labels.json everything gets generic names ("Queue 2")
  let labels: LabelsFile = {};
  try {
    labels = await fetchLabels(LABELS_URL);
  } catch (error) {
    console.warn(`Ignoring ${LABELS_URL}:`, error);
  }

  // Optional too: without a theme every box is plain
  let skins: Skins = NO_SKINS;
  try {
    skins = await loadSkins(await fetchTheme(THEME_URL), THEME_URL);
  } catch (error) {
    console.warn(`Ignoring ${THEME_URL}:`, error);
  }
  offerThemes(element("theme") as HTMLSelectElement).catch((error) =>
    console.warn(`No themes on offer at ${THEMES_URL}:`, error),
  );

  const world = new World(trace, {
    labels,
    skins,
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
  app.canvas.addEventListener("dblclick", (e) => {
    // Clicking something clickable (e.g. a belt's "+N") twice isn't a reset
    const at = new Point();
    app.renderer.events.mapPositionToPoint(at, e.clientX, e.clientY);
    if (
      app.renderer.events.rootBoundary.hitTest(at.x, at.y)?.cursor === "pointer"
    )
      return;
    world.resetView();
    showZoom();
  });

  // The select is the one source of truth: applied now (its default) and on every change
  const view = element("projection") as HTMLSelectElement;
  const applyProjection = () =>
    world.setProjection(PROJECTIONS[view.value] ?? FLAT);
  applyProjection();
  view.addEventListener("change", applyProjection);

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
  const kpiStrip = element("kpis");
  // The KPI panel can be hidden, e.g. to show the scene alone
  const kpiToggle = element("kpi-toggle") as HTMLInputElement;
  const showKpis = () =>
    kpiStrip.classList.toggle("hidden", !kpiToggle.checked);
  kpiToggle.addEventListener("change", showKpis);
  showKpis();
  const refreshKpis = throttle(RATE_REFRESH_MS);
  app.ticker.add((ticker) => {
    // Real frame time in, simulated time out, held at the trace's end
    const now = SimMs(Math.min(clock.advance(ticker.deltaMS), trace.endMs));
    if (now >= trace.endMs && !clock.paused) {
      clock.togglePause();
      showClock();
    }
    world.tick(now, WallMs(performance.now()));
    refreshKpis(() =>
      showTiles(kpiStrip, kpiTiles(world.kpis(now), world.names)),
    );
    const shown = clockTime(trace, now);
    if (time.textContent !== shown) time.textContent = shown;
  });
})();
