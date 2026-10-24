"""A toy discrete-event simulation that writes a flow trace, loosely after a vehicle-repair sim.

Each site runs two stages, inspection then repair. A stage is a queue, the stations it feeds, and
an inventory of SKUs those stations draw from (inspection now and then takes a consumable). A fixed fleet cycles through: arrive, get inspected, wait
for repair, get repaired (taking parts), go back out, and come back later.

- Queues are prioritised: an item goes behind everything of equal or higher priority, and may be
  bumped up a priority while it waits (a `queue_move`).
- A station admits the first queued item whose parts are all in its stage's inventory, skipping
  blocked ones.
- Inspections take ~N(3, 1) minutes, repairs `repair_slowdown` (3×) as long. Both say how long
  they'll take (`expected_duration_us`), unless `repair_duration_known` is off (`UNKNOWN`).
- The inspection queues start backed up (`initially_queued`), the rest of the fleet trickles in.

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

from flowtrace.events import FORMAT_VERSION, UNKNOWN
from flowtrace.static import NodeKind
from flowtrace.trace import Trace, validated, write_trace
from flowtrace.validate import problems

US_PER_MIN = 60_000_000
US_PER_HOUR = 60 * US_PER_MIN
SKU_NAMES = ("wheel", "seat", "engine", "door", "light", "track", "radio", "filter")


@dataclass(frozen=True)
class Config:
    hours: float = 8
    sites: int = 2
    fleet_per_site: int = 90
    # How many of the fleet are already waiting in the inspection queue at t = 0: 10× the
    # viewer's 8-slot belt, so it starts visibly backed up. The rest trickle in.
    initially_queued: int = 80
    inspection_stations: int = 2
    repair_stations: int = 3
    skus: int = 5
    initial_stock: int = 12
    max_stock: int = 20
    # Each delivery adds this many of every SKU, up to `max_stock`
    delivery_size: int = 6
    delivery_every_min: int = 20
    # Processing time of an inspection, Gaussian: (mean, sd) in minutes, never shorter than
    # `processing_floor_min`
    processing_min: tuple[float, float] = (3, 1)
    processing_floor_min: float = 0.5
    # Repairs take this many times as long: same distribution, scaled (mean and sd)
    repair_slowdown: float = 3
    # Whether repairs tell how long they'll take (`expected_duration_us`); False writes `UNKNOWN`,
    # as a sim that can't predict them would
    repair_duration_known: bool = True
    # Share of items whose inspection takes a consumable (one unit of one SKU)
    inspection_consumable: float = 0.5
    # How long a repaired item stays out before it comes back
    away_min: tuple[int, int] = (10, 40)
    # Mean minutes between priority bumps of some waiting item, per site
    bump_every_min: int = 3
    # The fleet's first arrivals are spread over this long
    arrivals_over_min: int = 15
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
    inspection: Stage
    repair: Stage
    fleet: tuple[int, ...]

    @property
    def stages(self) -> tuple[Stage, Stage]:
        return (self.inspection, self.repair)


def layout(cfg: Config) -> tuple[list[Site], list[int]]:
    """Ids for every place, sites numbered from 1; and the SKU catalogue. A stage's inventory has
    the same id as its queue."""
    sites: list[Site] = []
    station = 1
    item = 1
    for s in range(1, cfg.sites + 1):
        inspection = tuple(range(station, station + cfg.inspection_stations))
        station += cfg.inspection_stations
        repair = tuple(range(station, station + cfg.repair_stations))
        station += cfg.repair_stations
        fleet = tuple(range(item, item + cfg.fleet_per_site))
        item += cfg.fleet_per_site
        sites.append(
            Site(
                s,
                inspection=Stage(2 * s - 1, inspection, 2 * s - 1),
                repair=Stage(2 * s, repair, 2 * s),
                fleet=fleet,
            )
        )
    return sites, [100 + k for k in range(cfg.skus)]


# ── Scheduled happenings, a sum type ──────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Arrive:
    site: Site
    item: int


@dataclass(frozen=True)
class InspectionDone:
    site: Site
    job: int


@dataclass(frozen=True)
class RepairDone:
    site: Site
    job: int


@dataclass(frozen=True)
class Bump:
    site: Site


@dataclass(frozen=True)
class Delivery:
    site: Site


type Happening = Arrive | InspectionDone | RepairDone | Bump | Delivery


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
    jobs: dict[int, Job] = field(default_factory=dict[int, Job])
    busy: set[int] = field(default_factory=set[int])
    stock: dict[tuple[int, int], int] = field(default_factory=dict[tuple[int, int], int])
    next_job: int = 1

    def at(self, t: int, happening: Happening) -> None:
        heapq.heappush(self.pending, (t, self.order, happening))
        self.order += 1

    def minutes(self, bounds: tuple[int, int]) -> int:
        return self.rng.randint(*bounds) * US_PER_MIN

    def processing(self, scale: float = 1) -> int:
        """How long a job takes: `Config.processing_min`, scaled by `scale`"""
        mean, sd = self.cfg.processing_min
        minutes = max(self.rng.gauss(mean, sd), self.cfg.processing_floor_min) * scale
        return int(minutes * US_PER_MIN)

    # Queues: kept sorted by priority (highest first), ties in arrival order

    def enqueue(self, queue: int, item: int) -> None:
        members = self.queues.setdefault(queue, [])
        index = sum(1 for other in members if self.priority[other] >= self.priority[item])
        members.insert(index, item)
        self.rec.emit("queue_enter", self.now, item_id=item, queue_id=queue, index=index)

    def dequeue(self, queue: int, item: int) -> None:
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

    def in_stock(self, stage: Stage, item: int) -> bool:
        needs = self.needs[(item, stage.queue)]
        return all(self.stock[(stage.inventory, sku)] >= n for sku, n in needs.items())

    # Allocation: fill each stage's free stations from its queue

    def allocate(self, site: Site) -> None:
        for stage in site.stages:
            self.fill(site, stage)

    def fill(self, site: Site, stage: Stage) -> None:
        for station in stage.stations:
            if station in self.busy:
                continue
            # The first item whose parts are all here; blocked ones keep their place
            ready = next((i for i in self.queues.get(stage.queue, []) if self.in_stock(stage, i)), None)
            if ready is None:
                continue
            self.dequeue(stage.queue, ready)
            needs = self.needs[(ready, stage.queue)]
            if stage is site.inspection:
                duration = self.processing()
                job = self.start(station, ready, expected=duration)
                done: Happening = InspectionDone(site, job)
            else:
                duration = self.processing(self.cfg.repair_slowdown)
                expected = duration if self.cfg.repair_duration_known else UNKNOWN
                job = self.start(station, ready, expected=expected)
                done = RepairDone(site, job)
            for sku, n in sorted(needs.items()):
                self.rec.emit(
                    "consumption", self.now, job_id=job, inventory_id=stage.inventory, sku_id=sku, count=n
                )
            for sku, n in sorted(needs.items()):
                self.set_stock(stage.inventory, sku, self.stock[(stage.inventory, sku)] - n)
            self.at(self.now + duration, done)

    # What each happening does

    def happen(self, h: Happening) -> None:
        match h:
            case Arrive(site=site, item=item):
                self.priority[item] = self.rng.choice((0, 0, 0, 1, 1, 2))
                # Repair: 2 or 3 distinct SKUs, 1 to 3 of each; a fifth of items need none
                picked = self.rng.sample(self.skus, self.rng.randint(2, 3))
                repair = {sku: self.rng.randint(1, 3) for sku in picked}
                self.needs[(item, site.repair.queue)] = {} if self.rng.random() < 0.2 else repair
                # Inspection: now and then one consumable
                consumable = self.rng.random() < self.cfg.inspection_consumable
                self.needs[(item, site.inspection.queue)] = (
                    {self.rng.choice(self.skus): 1} if consumable else {}
                )
                self.enqueue(site.inspection.queue, item)
            case InspectionDone(site=site, job=job):
                done = self.end(job)
                self.enqueue(site.repair.queue, done.item)
            case RepairDone(site=site, job=job):
                done = self.end(job)
                # Back out in the world, until it comes back for another round
                self.at(self.now + self.minutes(self.cfg.away_min), Arrive(site, done.item))
            case Bump(site=site):
                self.bump(self.rng.choice([stage.queue for stage in site.stages]))
                gap = self.rng.expovariate(1 / self.cfg.bump_every_min)
                self.at(self.now + int(gap * US_PER_MIN) + 1, Bump(site))
            case Delivery(site=site):
                for inventory in (stage.inventory for stage in site.stages):
                    for sku in self.skus:
                        level = self.stock[(inventory, sku)]
                        topped = min(level + self.cfg.delivery_size, self.cfg.max_stock)
                        if topped != level:
                            self.set_stock(inventory, sku, topped)
                self.at(self.now + self.cfg.delivery_every_min * US_PER_MIN, Delivery(site))
            case _:
                assert_never(h)
        self.allocate(h.site)

    def run(self, sites: list[Site], end: int) -> None:
        for site in sites:
            for stage in site.stages:
                for sku in self.skus:
                    self.set_stock(stage.inventory, sku, self.cfg.initial_stock)
            # Some of the fleet is already waiting; the rest trickles in
            for k, item in enumerate(site.fleet):
                start = 0 if k < self.cfg.initially_queued else self.rng.randint(1, self.cfg.arrivals_over_min * US_PER_MIN)
                self.at(start, Arrive(site, item))
            self.at(self.cfg.delivery_every_min * US_PER_MIN, Delivery(site))
            self.at(self.rng.randint(1, self.cfg.bump_every_min) * US_PER_MIN, Bump(site))
        while self.pending and self.pending[0][0] <= end:
            t, _, happening = heapq.heappop(self.pending)
            self.now = t
            self.happen(happening)


# ── Building the trace ────────────────────────────────────────────────────────────────────────


def _static(sites: list[Site], skus: list[int]) -> dict[str, pd.DataFrame]:
    Q, S, I = NodeKind.QUEUE, NodeKind.STATION, NodeKind.INVENTORY
    stages = [stage for site in sites for stage in site.stages]
    edges = [
        *(
            # Items: inspection queue → its stations → repair queue → its stations
            edge
            for site in sites
            for edge in (
                *((Q, site.inspection.queue, S, st) for st in site.inspection.stations),
                *((S, st, Q, site.repair.queue) for st in site.inspection.stations),
                *((Q, site.repair.queue, S, st) for st in site.repair.stations),
            )
        ),
        # Parts: each stage's inventory supplies its stations
        *((I, stage.inventory, S, st) for stage in stages for st in stage.stations),
    ]
    return {
        "sites": pd.DataFrame({"site_id": [s.id for s in sites]}),
        "queues": pd.DataFrame(
            [(stage.queue, site.id) for site in sites for stage in site.stages],
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


def _labels(sites: list[Site], skus: list[int]) -> pd.DataFrame:
    rows: list[tuple[str, int, str]] = [("skus", sku, SKU_NAMES[k]) for k, sku in enumerate(skus)]
    for site in sites:
        name = f"Site {chr(ord('A') + site.id - 1)}"
        rows += [("sites", site.id, name), *(("items", i, f"Vehicle {i}") for i in site.fleet)]
        for stage, what in ((site.inspection, "inspection"), (site.repair, "repair")):
            rows += [
                ("queues", stage.queue, f"{name} {what}"),
                ("inventories", stage.inventory, f"{name} {what} stores"),
                *(("stations", st, f"{name} {what} bay {k + 1}") for k, st in enumerate(stage.stations)),
            ]
    return pd.DataFrame(rows, columns=["table", "id", "label"])


def simulate(cfg: Config, seed: int) -> Trace:
    """Run the toy sim for `cfg.hours` and return its (schema-validated) trace"""
    sites, skus = layout(cfg)
    end = int(cfg.hours * US_PER_HOUR)
    sim = Sim(cfg, random.Random(seed), skus)
    sim.run(sites, end)
    rec = sim.rec
    return validated(
        Trace(
            **_static(sites, skus),
            queue_enter=rec.frame("queue_enter", ["item_id", "queue_id", "index"]),
            queue_leave=rec.frame("queue_leave", ["item_id", "queue_id"]),
            queue_move=rec.frame("queue_move", ["item_id", "queue_id", "index"]),
            station_start=rec.frame(
                "station_start", ["job_id", "item_id", "station_id", "expected_duration_us"]
            ),
            station_end=rec.frame("station_end", ["job_id"]),
            consumption=rec.frame("consumption", ["job_id", "inventory_id", "sku_id", "count"]),
            stock=rec.frame("stock", ["inventory_id", "sku_id", "count"]),
            meta=pd.DataFrame(
                {
                    "format_version": [FORMAT_VERSION],
                    "start_unix_us": [cfg.start_unix_us],
                    "end_sim_time_us": [end],
                }
            ),
            labels=_labels(sites, skus),
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
