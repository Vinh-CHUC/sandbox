"""A toy discrete-event simulation that writes a flow trace.

Each site runs a chain of stages; one store, outside every site (`NO_SITE`), is shared by all. A
stage is a queue, the stations it feeds, and an inventory of SKUs those stations draw from; the
store is a queue that feeds no station: a sink, where finished items stay. Items arrive from
outside into their site's first queue, go through the stages they need (later ones are optional
per item, see `visit_chance`), and end up in the store.

- Queues are prioritised: an item goes behind everything of equal or higher priority, and may be
  bumped up a priority while it waits (a `queue_move`).
- A station admits the first queued item whose parts are all in its stage's inventory, skipping
  the ones that are short: those are marked blocked (`item_status`), with what they're short of
  (`item_shortage`, consistent with the stock levels written alongside), until they can go.
- Stock is reordered when it drops below `reorder_point`, arriving after a random lead time; some
  SKUs are needed much more often than others (`demand_skew`), so the same ones run out.
- Items come in types (`item_types`, some much more common): each type wears out its own parts
  first, so different types run short of different SKUs.
- Processing takes ~N(3, 1) minutes, times the stage's `slowdown`.
- The first queues start backed up (`initially_queued`), then items keep arriving.

It names nothing: display names live in the viewer's `labels.json`, out of the repo.

    $ python -m flowtrace.generate --out ../public/trace --seed 1 --hours 8

`simulate` is deterministic for a given seed: the same config and seed give the same trace.
"""

import argparse
import heapq
import random
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import assert_never

import pandas as pd

from flowtrace.events import FORMAT_VERSION, UNKNOWN, ItemState
from flowtrace.static import NO_SITE, NodeKind
from flowtrace.trace import Trace, validated, write_trace
from flowtrace.validate import problems

US_PER_MIN = 60_000_000
US_PER_HOUR = 60 * US_PER_MIN


@dataclass(frozen=True)
class StageConfig:
    stations: int
    # Processing takes this many times as long as `Config.processing_min` (mean and sd)
    slowdown: float = 1
    # Share of items that need anything from this stage's inventory; those that do take
    # `skus_per_job` distinct SKUs, `units_per_sku` of each
    needs_chance: float = 1.0
    skus_per_job: tuple[int, int] = (1, 1)
    units_per_sku: tuple[int, int] = (1, 1)
    # Whether jobs tell how long they'll take (`expected_duration_us`); False writes `UNKNOWN`,
    # as a sim that can't predict them would
    duration_known: bool = True
    # Share of items that need this stage at all (the first stage is always visited); the others
    # skip it, straight to the next stage they need, or to the store
    visit_chance: float = 1.0


@dataclass(frozen=True)
class Config:
    hours: float = 8
    sites: int = 2
    # How many items are already waiting in each first queue at t = 0: 10× the viewer's 8-slot
    # belt, so it starts visibly backed up
    initially_queued: int = 80
    # Then new items keep arriving, on average this many per hour per site (Poisson)
    arrivals_per_hour: float = 22
    stages: tuple[StageConfig, ...] = (
        # Quick, and takes a single consumable from half the items
        StageConfig(stations=2, needs_chance=0.5),
        # 3× slower, most items take several parts, and some items don't need it at all
        StageConfig(
            stations=3,
            slowdown=3,
            needs_chance=0.8,
            skus_per_job=(2, 3),
            units_per_sku=(1, 3),
            visit_chance=0.6,
        ),
    )
    skus: int = 8
    # Item types, type k arriving with weight 1 / (k + 1) ** type_skew; each type's SKU demand is
    # the catalogue's `demand_skew` ranking, rotated by its index (so its favourite parts differ)
    item_types: int = 4
    type_skew: float = 0.8
    initial_stock: int = 12
    # When a SKU's stock drops below this, `order_size` more are ordered; they arrive after a
    # lead time drawn from `lead_time_min`
    # Tuned so about a third of the items get blocked at some point, for ~15 min (median)
    reorder_point: int = 6
    order_size: int = 12
    lead_time_min: tuple[int, int] = (10, 40)
    # SKU k is picked with weight 1 / (k + 1) ** demand_skew: the first ones run out most
    demand_skew: float = 1.2
    # Processing time, Gaussian: (mean, sd) in minutes, never shorter than `processing_floor_min`
    processing_min: tuple[float, float] = (3, 1)
    processing_floor_min: float = 0.5
    # Mean minutes between priority bumps of some waiting item, per site
    bump_every_min: int = 3
    # 1 Jan 2026, for display only
    start_unix_us: int = 1_767_225_600_000_000


# ── Topology ──────────────────────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Stage:
    """One step of a site: a queue, the stations it feeds, and the inventory they draw from"""

    queue: int
    stations: tuple[int, ...]
    inventory: int


@dataclass(frozen=True)
class Site:
    id: int
    stages: tuple[Stage, ...]
    # A queue feeding no station, where finished items stay: the same one for every site
    store: int


def layout(cfg: Config) -> tuple[list[Site], list[int]]:
    """Ids for every place, all numbered from 1; and the SKU catalogue. A stage's inventory has the
    same id as its queue; the shared store comes after every site's queues."""
    stages_of: list[tuple[Stage, ...]] = []
    queue = station = 1
    for _ in range(cfg.sites):
        stages: list[Stage] = []
        for stage_cfg in cfg.stages:
            stations = tuple(range(station, station + stage_cfg.stations))
            station += stage_cfg.stations
            stages.append(Stage(queue, stations, queue))
            queue += 1
        stages_of.append(tuple(stages))
    store = queue
    sites = [Site(s, stages, store) for s, stages in zip(range(1, cfg.sites + 1), stages_of)]
    return sites, [100 + k for k in range(cfg.skus)]


# ── Scheduled happenings, a sum type ──────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Arrive:
    """A new item from outside, into its site's first queue; the next one is scheduled"""

    site: Site


@dataclass(frozen=True)
class Done:
    site: Site
    stage: int  # index into `site.stages`
    job: int


@dataclass(frozen=True)
class Bump:
    site: Site


@dataclass(frozen=True)
class Restock:
    """An order of `count` × `sku` arrives at `inventory`"""

    site: Site
    inventory: int
    sku: int
    count: int


type Happening = Arrive | Done | Bump | Restock


# ── Recording ─────────────────────────────────────────────────────────────────────────────────


@dataclass
class Recorder:
    """Event rows per table, numbered with one `seq` across all of them"""

    rows: defaultdict[str, list[dict[str, int]]] = field(
        default_factory=lambda: defaultdict[str, list[dict[str, int]]](list)
    )
    seq: int = 0

    def emit(self, table: str, t: int, **columns: int) -> None:
        self.rows[table].append({"seq": self.seq, "sim_time_us": t, **columns})
        self.seq += 1

    def frame(self, table: str, columns: list[str]) -> pd.DataFrame:
        return pd.DataFrame(self.rows[table], columns=["seq", "sim_time_us", *columns])


# ── The simulation ────────────────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Job:
    item: int
    station: int


@dataclass
class Sim:
    cfg: Config
    rng: random.Random
    skus: list[int]
    rec: Recorder = field(default_factory=Recorder)
    now: int = 0
    pending: list[tuple[int, int, Happening]] = field(
        default_factory=list[tuple[int, int, Happening]]
    )
    order: int = 0  # tie-break for happenings at the same time: first scheduled, first run
    queues: dict[int, list[int]] = field(default_factory=dict[int, list[int]])
    priority: dict[int, int] = field(default_factory=dict[int, int])
    # (item, queue) → what the item needs from that stage's inventory, SKU → count
    needs: dict[tuple[int, int], dict[int, int]] = field(
        default_factory=dict[tuple[int, int], dict[int, int]]
    )
    # Queued items whose parts are short right now
    blocked: set[int] = field(default_factory=set[int])
    # item → its type, from 1
    item_type: dict[int, int] = field(default_factory=dict[int, int])
    # item → the stages it needs, by index, in order
    route: dict[int, list[int]] = field(default_factory=dict[int, list[int]])
    # (item, inventory, sku) → how many the item is short of, for queued items that are
    shortages: dict[tuple[int, int, int], int] = field(default_factory=dict[tuple[int, int, int], int])
    # (inventory, sku) with an order on its way
    on_order: set[tuple[int, int]] = field(default_factory=set[tuple[int, int]])
    next_item: int = 1
    jobs: dict[int, Job] = field(default_factory=dict[int, Job])
    busy: set[int] = field(default_factory=set[int])
    stock: dict[tuple[int, int], int] = field(default_factory=dict[tuple[int, int], int])
    next_job: int = 1

    def at(self, t: int, happening: Happening) -> None:
        heapq.heappush(self.pending, (t, self.order, happening))
        self.order += 1

    def minutes(self, bounds: tuple[int, int]) -> int:
        return self.rng.randint(*bounds) * US_PER_MIN

    def processing(self, slowdown: float) -> int:
        """How long a job takes: `Config.processing_min`, times `slowdown`"""
        mean, sd = self.cfg.processing_min
        minutes = max(self.rng.gauss(mean, sd), self.cfg.processing_floor_min) * slowdown
        return int(minutes * US_PER_MIN)

    # Queues: kept sorted by priority (highest first), ties in arrival order

    def enqueue(self, queue: int, item: int) -> None:
        members = self.queues.setdefault(queue, [])
        index = sum(1 for other in members if self.priority[other] >= self.priority[item])
        members.insert(index, item)
        self.rec.emit("queue_enter", self.now, item_id=item, queue_id=queue, index=index)

    def store(self, site: Site, item: int) -> None:
        """Into the store, for good: it's a sink (unordered: at the back)"""
        members = self.queues.setdefault(site.store, [])
        self.rec.emit("queue_enter", self.now, item_id=item, queue_id=site.store, index=len(members))
        members.append(item)

    def arrive(self, site: Site) -> None:
        """A new item from outside: what it'll need, then into the first queue"""
        item = self.next_item
        self.next_item += 1
        types = range(self.cfg.item_types)
        weights = [1 / (k + 1) ** self.cfg.type_skew for k in types]
        self.item_type[item] = 1 + self.rng.choices(types, weights)[0]
        self.priority[item] = self.rng.choice((0, 0, 0, 1, 1, 2))
        # The first stage always, later ones only if the item needs them
        self.route[item] = [
            k
            for k, stage_cfg in enumerate(self.cfg.stages)
            if k == 0 or self.rng.random() < stage_cfg.visit_chance
        ]
        for k, (stage, stage_cfg) in enumerate(zip(site.stages, self.cfg.stages)):
            needed = k in self.route[item]
            draw = self.draw_needs(stage_cfg, self.item_type[item]) if needed else {}
            self.needs[(item, stage.queue)] = draw
        self.enqueue(site.stages[0].queue, item)

    def dequeue(self, queue: int, item: int) -> None:
        self.clear_shortages(item)
        self.mark(item, blocked=False)
        self.queues[queue].remove(item)
        self.rec.emit("queue_leave", self.now, item_id=item, queue_id=queue)

    def bump(self, queue: int) -> None:
        """Raise a random waiting item's priority, moving it up its queue if that changes its place"""
        candidates = [i for i in self.queues.get(queue, []) if self.priority[i] < 2]
        if not candidates:
            return
        item = self.rng.choice(candidates)
        self.priority[item] += 1
        members = self.queues[queue]
        before = members.index(item)
        members.remove(item)
        index = sum(1 for other in members if self.priority[other] >= self.priority[item])
        members.insert(index, item)
        if index != before:
            self.rec.emit("queue_move", self.now, item_id=item, queue_id=queue, index=index)

    def short(self, item: int, inventory: int, sku: int, missing: int) -> None:
        """Record how many of `sku` a queued item is short of, if it changed (0 clears it)"""
        key = (item, inventory, sku)
        if self.shortages.get(key, 0) == missing:
            return
        if missing == 0:
            del self.shortages[key]
        else:
            self.shortages[key] = missing
        self.rec.emit(
            "item_shortage", self.now, item_id=item, inventory_id=inventory, sku_id=sku, missing=missing
        )

    def clear_shortages(self, item: int) -> None:
        for i, inventory, sku in [key for key in self.shortages if key[0] == item]:
            self.short(i, inventory, sku, 0)

    def mark(self, item: int, blocked: bool) -> None:
        """Record a queued item's state, if it changed"""
        if blocked == (item in self.blocked):
            return
        if blocked:
            self.blocked.add(item)
        else:
            self.blocked.discard(item)
        state = ItemState.BLOCKED if blocked else ItemState.WAITING
        self.rec.emit("item_status", self.now, item_id=item, status=state)

    # Stations

    def start(self, station: int, item: int, expected: int) -> int:
        job = self.next_job
        self.next_job += 1
        self.jobs[job] = Job(item, station)
        self.busy.add(station)
        self.rec.emit(
            "station_start",
            self.now,
            job_id=job,
            item_id=item,
            station_id=station,
            expected_duration_us=expected,
        )
        return job

    def end(self, job: int) -> Job:
        done = self.jobs.pop(job)
        self.busy.discard(done.station)
        self.rec.emit("station_end", self.now, job_id=job)
        return done

    def set_stock(self, inventory: int, sku: int, count: int) -> None:
        self.stock[(inventory, sku)] = count
        self.rec.emit("stock", self.now, inventory_id=inventory, sku_id=sku, count=count)

    def reorder(self, site: Site, inventory: int, sku: int) -> None:
        """Order more of `sku` if it's running low and nothing's on its way already"""
        if self.stock[(inventory, sku)] >= self.cfg.reorder_point or (inventory, sku) in self.on_order:
            return
        self.on_order.add((inventory, sku))
        arrives = self.now + self.minutes(self.cfg.lead_time_min)
        self.at(arrives, Restock(site, inventory, sku, self.cfg.order_size))

    def in_stock(self, stage: Stage, item: int) -> bool:
        needs = self.needs[(item, stage.queue)]
        return all(self.stock[(stage.inventory, sku)] >= n for sku, n in needs.items())

    # Allocation: fill each stage's free stations from its queue, then mark who's blocked

    def allocate(self, site: Site) -> None:
        for k in range(len(site.stages)):
            self.fill(site, k)
        for stage in site.stages:
            for item in self.queues.get(stage.queue, []):
                # Short of anything? Exactly how much, from the stock levels as they are now
                for sku, n in self.needs[(item, stage.queue)].items():
                    missing = max(0, n - self.stock[(stage.inventory, sku)])
                    self.short(item, stage.inventory, sku, missing)
                self.mark(item, blocked=not self.in_stock(stage, item))

    def fill(self, site: Site, k: int) -> None:
        stage, stage_cfg = site.stages[k], self.cfg.stages[k]
        for station in stage.stations:
            if station in self.busy:
                continue
            # The first item whose parts are all here; short ones keep their place
            ready = next((i for i in self.queues.get(stage.queue, []) if self.in_stock(stage, i)), None)
            if ready is None:
                continue
            self.dequeue(stage.queue, ready)
            duration = self.processing(stage_cfg.slowdown)
            job = self.start(station, ready, expected=duration if stage_cfg.duration_known else UNKNOWN)
            needs = self.needs[(ready, stage.queue)]
            for sku, n in sorted(needs.items()):
                self.rec.emit(
                    "consumption", self.now, job_id=job, inventory_id=stage.inventory, sku_id=sku, count=n
                )
            for sku, n in sorted(needs.items()):
                self.set_stock(stage.inventory, sku, self.stock[(stage.inventory, sku)] - n)
                self.reorder(site, stage.inventory, sku)
            self.at(self.now + duration, Done(site, k, job))

    # What each happening does

    def happen(self, h: Happening) -> None:
        match h:
            case Arrive(site=site):
                self.arrive(site)
                gap = self.rng.expovariate(self.cfg.arrivals_per_hour / 60)
                self.at(self.now + int(gap * US_PER_MIN) + 1, Arrive(site))
            case Done(site=site, stage=k, job=job):
                done = self.end(job)
                later = [j for j in self.route[done.item] if j > k]
                if later:
                    self.enqueue(site.stages[later[0]].queue, done.item)
                else:
                    self.store(site, done.item)
            case Bump(site=site):
                self.bump(self.rng.choice([stage.queue for stage in site.stages]))
                gap = self.rng.expovariate(1 / self.cfg.bump_every_min)
                self.at(self.now + int(gap * US_PER_MIN) + 1, Bump(site))
            case Restock(site=site, inventory=inventory, sku=sku, count=count):
                self.on_order.discard((inventory, sku))
                self.set_stock(inventory, sku, self.stock[(inventory, sku)] + count)
                self.reorder(site, inventory, sku)  # still low: order again
            case _:
                assert_never(h)
        self.allocate(h.site)

    def draw_needs(self, stage_cfg: StageConfig, item_type: int) -> dict[int, int]:
        if self.rng.random() >= stage_cfg.needs_chance:
            return {}
        # Distinct SKUs, this type's favourites much more likely (see `Config.demand_skew`)
        n = len(self.skus)
        rank = {sku: (k - (item_type - 1)) % n for k, sku in enumerate(self.skus)}
        left = list(self.skus)
        picked: list[int] = []
        for _ in range(self.rng.randint(*stage_cfg.skus_per_job)):
            weights = [1 / (rank[sku] + 1) ** self.cfg.demand_skew for sku in left]
            picked.append(left.pop(self.rng.choices(range(len(left)), weights)[0]))
        return {sku: self.rng.randint(*stage_cfg.units_per_sku) for sku in picked}

    def run(self, sites: list[Site], end: int) -> None:
        for site in sites:
            for stage in site.stages:
                for sku in self.skus:
                    self.set_stock(stage.inventory, sku, self.cfg.initial_stock)
            # A backlog to start with, then a steady trickle of new items
            for _ in range(self.cfg.initially_queued):
                self.arrive(site)
            self.at(int(self.rng.expovariate(self.cfg.arrivals_per_hour / 60) * US_PER_MIN) + 1, Arrive(site))
            self.at(self.rng.randint(1, self.cfg.bump_every_min) * US_PER_MIN, Bump(site))
        while self.pending and self.pending[0][0] <= end:
            t, _, happening = heapq.heappop(self.pending)
            self.now = t
            self.happen(happening)


# ── Building the trace ────────────────────────────────────────────────────────────────────────


def _next_queues(site: Site, k: int, cfg: Config) -> list[int]:
    """Where an item can go after stage `k`: the next stage, any after it that every stage in
    between may be skipped to reach, and the store if all the rest may be skipped"""
    nxt: list[int] = []
    for j in range(k + 1, len(site.stages)):
        nxt.append(site.stages[j].queue)
        if cfg.stages[j].visit_chance >= 1:
            return nxt
    return [*nxt, site.store]


def _static(sites: list[Site], skus: list[int], cfg: Config) -> dict[str, pd.DataFrame]:
    Q, S, I = NodeKind.QUEUE, NodeKind.STATION, NodeKind.INVENTORY
    stages = [stage for site in sites for stage in site.stages]
    edges = [
        *(
            # Items: each stage's queue → its stations → whichever queue can come next
            edge
            for site in sites
            for k, stage in enumerate(site.stages)
            for edge in (
                *((Q, stage.queue, S, st) for st in stage.stations),
                *((S, st, Q, nxt) for st in stage.stations for nxt in _next_queues(site, k, cfg)),
            )
        ),
        # Parts: each stage's inventory supplies its stations
        *((I, stage.inventory, S, st) for stage in stages for st in stage.stations),
    ]
    return {
        "sites": pd.DataFrame({"site_id": [s.id for s in sites]}),
        "queues": pd.DataFrame(
            [
                *((stage.queue, site.id) for site in sites for stage in site.stages),
                # The one store, shared: it belongs to no site
                (sites[0].store, NO_SITE),
            ],
            columns=["queue_id", "site_id"],
        ),
        "stations": pd.DataFrame(
            [(st, site.id) for site in sites for stage in site.stages for st in stage.stations],
            columns=["station_id", "site_id"],
        ),
        "inventories": pd.DataFrame(
            [(stage.inventory, site.id) for site in sites for stage in site.stages],
            columns=["inventory_id", "site_id"],
        ),
        "skus": pd.DataFrame({"sku_id": skus}),
        "inventory_skus": pd.DataFrame(
            [(stage.inventory, sku) for stage in stages for sku in skus],
            columns=["inventory_id", "sku_id"],
        ),
        "edges": pd.DataFrame(edges, columns=["from_kind", "from_id", "to_kind", "to_id"]),
    }


def simulate(cfg: Config, seed: int) -> Trace:
    """Run the toy sim for `cfg.hours` and return its (schema-validated) trace"""
    sites, skus = layout(cfg)
    end = int(cfg.hours * US_PER_HOUR)
    sim = Sim(cfg, random.Random(seed), skus)
    sim.run(sites, end)
    rec = sim.rec
    return validated(
        Trace(
            **_static(sites, skus, cfg),
            queue_enter=rec.frame("queue_enter", ["item_id", "queue_id", "index"]),
            queue_leave=rec.frame("queue_leave", ["item_id", "queue_id"]),
            queue_move=rec.frame("queue_move", ["item_id", "queue_id", "index"]),
            station_start=rec.frame(
                "station_start", ["job_id", "item_id", "station_id", "expected_duration_us"]
            ),
            station_end=rec.frame("station_end", ["job_id"]),
            consumption=rec.frame("consumption", ["job_id", "inventory_id", "sku_id", "count"]),
            stock=rec.frame("stock", ["inventory_id", "sku_id", "count"]),
            item_status=rec.frame("item_status", ["item_id", "status"]),
            item_shortage=rec.frame(
                "item_shortage", ["item_id", "inventory_id", "sku_id", "missing"]
            ),
            item_types=pd.DataFrame({"item_type_id": list(range(1, cfg.item_types + 1))}),
            items=pd.DataFrame(
                sorted(sim.item_type.items()), columns=["item_id", "item_type_id"]
            ),
            meta=pd.DataFrame(
                {
                    "format_version": [FORMAT_VERSION],
                    "start_unix_us": [cfg.start_unix_us],
                    "end_sim_time_us": [end],
                }
            ),
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Write a toy flow trace (parquet tables).")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--hours", type=float, default=8)
    parser.add_argument("--sites", type=int, default=2)
    args = parser.parse_args()

    trace = simulate(Config(hours=args.hours, sites=args.sites), args.seed)
    # Never write a trace the viewer would choke on
    if errors := problems(trace):
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)
    write_trace(trace, args.out)
    counts = {name: len(df) for name, df in vars(trace).items() if df is not None}
    print(f"wrote {args.out}: {counts}")


if __name__ == "__main__":
    main()
