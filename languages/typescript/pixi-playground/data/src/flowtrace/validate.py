"""Replay validation: does a trace describe a world that could actually happen?

Schemas check each table alone; this replays every event in `seq` order and checks them
together. It returns all violations, each tagged with the offending `seq`:

    >>> problems(trace)
    ['seq 12: item 3 enters queue 1 but is already in queue 1',
     'seq 40: job 7 starts at station 10 coming from queue 2, but no edge queue 2 → station 10']

Moves: an item that leaves a place and arrives somewhere else *at the same `sim_time_us`* has
moved, and the move must follow an edge. Arriving later than it left (or for the first time)
means it came from outside the world, which needs no edge.
"""

import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import assert_never

import pandas as pd

from flowtrace.events import ItemState, duplicate_seqs
from flowtrace.static import NodeKind, dangling_references
from flowtrace.trace import EVENT_TABLES, Trace, read_trace

# ── Events as a sum type, one variant per event table ─────────────────────────────────────────


@dataclass(frozen=True)
class QueueEnter:
    seq: int
    t: int
    item: int
    queue: int
    index: int


@dataclass(frozen=True)
class QueueLeave:
    seq: int
    t: int
    item: int
    queue: int


@dataclass(frozen=True)
class QueueMove:
    seq: int
    t: int
    item: int
    queue: int
    index: int


@dataclass(frozen=True)
class StationStart:
    seq: int
    t: int
    job: int
    item: int
    station: int


@dataclass(frozen=True)
class StationEnd:
    seq: int
    t: int
    job: int


@dataclass(frozen=True)
class Consume:
    seq: int
    t: int
    job: int
    inventory: int
    sku: int
    count: int


@dataclass(frozen=True)
class StockLevel:
    seq: int
    t: int
    inventory: int
    sku: int
    count: int


@dataclass(frozen=True)
class Status:
    seq: int
    t: int
    item: int
    status: int


@dataclass(frozen=True)
class Shortage:
    seq: int
    t: int
    item: int
    inventory: int
    sku: int
    missing: int


type Event = (
    QueueEnter
    | QueueLeave
    | QueueMove
    | StationStart
    | StationEnd
    | Consume
    | StockLevel
    | Status
    | Shortage
)


def _rows(df: pd.DataFrame, columns: list[str]) -> list[list[int]]:
    return [[int(v) for v in row] for row in df[columns].itertuples(index=False)]


def stream(trace: Trace) -> list[Event]:
    """Every event of every table, as one list in `seq` order"""
    meta = ["seq", "sim_time_us"]
    events: list[Event] = [
        *(QueueEnter(*r) for r in _rows(trace.queue_enter, [*meta, "item_id", "queue_id", "index"])),
        *(QueueLeave(*r) for r in _rows(trace.queue_leave, [*meta, "item_id", "queue_id"])),
        *(QueueMove(*r) for r in _rows(trace.queue_move, [*meta, "item_id", "queue_id", "index"])),
        *(
            StationStart(*r)
            for r in _rows(trace.station_start, [*meta, "job_id", "item_id", "station_id"])
        ),
        *(StationEnd(*r) for r in _rows(trace.station_end, [*meta, "job_id"])),
        *(
            Consume(*r)
            for r in _rows(trace.consumption, [*meta, "job_id", "inventory_id", "sku_id", "count"])
        ),
        *(StockLevel(*r) for r in _rows(trace.stock, [*meta, "inventory_id", "sku_id", "count"])),
        *(
            Status(*r)
            for r in (
                []
                if trace.item_status is None
                else _rows(trace.item_status, [*meta, "item_id", "status"])
            )
        ),
        *(
            Shortage(*r)
            for r in (
                []
                if trace.item_shortage is None
                else _rows(
                    trace.item_shortage, [*meta, "item_id", "inventory_id", "sku_id", "missing"]
                )
            )
        ),
    ]
    return sorted(events, key=lambda e: e.seq)


# ── Replay state ──────────────────────────────────────────────────────────────────────────────

type Node = tuple[NodeKind, int]


@dataclass(frozen=True)
class Left:
    """Where an item last was, and when it left: a same-time arrival elsewhere is a move"""

    node: Node
    t: int


@dataclass
class World:
    edges: set[tuple[Node, Node]]  # includes supply edges: (inventory, station)
    stocked: set[tuple[int, int]]  # (inventory, sku)
    queues: dict[int, list[int]] = field(default_factory=dict[int, list[int]])
    occupant: dict[int, int] = field(default_factory=dict[int, int])  # station → job
    jobs: dict[int, StationStart] = field(default_factory=dict[int, StationStart])  # open jobs
    ended: set[int] = field(default_factory=set[int])
    where: dict[int, Node] = field(default_factory=dict[int, Node])  # item → current place
    left: dict[int, Left] = field(default_factory=dict[int, Left])  # item → where it last was
    stock: dict[tuple[int, int], int] = field(default_factory=dict[tuple[int, int], int])
    # (item, inventory, sku) → what the item needs in all (stock at the claim + missing)
    short: dict[tuple[int, int, int], int] = field(default_factory=dict[tuple[int, int, int], int])

    def shortages_of(self, item: int) -> list[tuple[int, int, int]]:
        return [key for key in self.short if key[0] == item]

    def covered(self) -> list[str]:
        """Shortages the stock covers by now: they should have been cleared"""
        return [
            f"item {item} is still short of sku {sku} but inventory {inv} has {self.stock[(inv, sku)]}"
            f" (needs {need})"
            for (item, inv, sku), need in self.short.items()
            if self.stock.get((inv, sku), 0) >= need
        ]

    def arrive(self, item: int, node: Node, t: int) -> str | None:
        """Place `item` at `node`; the reason it can't, if any"""
        if item in self.where:
            kind, at = self.where[item]
            return f"item {item} arrives at {_name(node)} but is already in {kind.name.lower()} {at}"
        came = self.left.pop(item, None)
        self.where[item] = node
        if came is not None and came.t == t and (came.node, node) not in self.edges:
            return f"item {item} moves {_name(came.node)} → {_name(node)}, but there is no such edge"
        return None

    def depart(self, item: int, t: int) -> None:
        node = self.where.pop(item)
        self.left[item] = Left(node, t)


def _name(node: Node) -> str:
    kind, node_id = node
    return f"{kind.name.lower()} {node_id}"


def _step(w: World, e: Event) -> str | None:
    """Apply one event to `w`; the violation it reveals, if any (state is updated regardless)"""
    match e:
        case QueueEnter(item=item, queue=q, index=index, t=t):
            members = w.queues.setdefault(q, [])
            if index > len(members):
                return f"item {item} enters queue {q} at {index}, past its end ({len(members)})"
            members.insert(index, item)
            return w.arrive(item, (NodeKind.QUEUE, q), t)
        case QueueLeave(item=item, queue=q, t=t):
            if item not in w.queues.get(q, []):
                return f"item {item} leaves queue {q} but isn't in it"
            short = w.shortages_of(item)
            # Leave regardless, so one mistake doesn't cascade into the item's every next event
            for key in short:
                del w.short[key]
            w.queues[q].remove(item)
            w.depart(item, t)
            return f"item {item} leaves queue {q} while still short of parts" if short else None
        case QueueMove(item=item, queue=q, index=index):
            members = w.queues.get(q, [])
            if item not in members:
                return f"item {item} moves within queue {q} but isn't in it"
            if index >= len(members):
                return f"item {item} moves to {index} in queue {q}, past its end ({len(members)})"
            members.remove(item)
            members.insert(index, item)
            return None
        case StationStart(job=job, item=item, station=s, t=t):
            if job in w.jobs or job in w.ended:
                return f"job {job} starts twice"
            if s in w.occupant:
                return f"job {job} starts at station {s}, busy with job {w.occupant[s]}"
            w.jobs[job] = e
            w.occupant[s] = job
            return w.arrive(item, (NodeKind.STATION, s), t)
        case StationEnd(job=job, t=t):
            start = w.jobs.pop(job, None)
            if start is None:
                return f"job {job} ends but isn't running"
            w.ended.add(job)
            del w.occupant[start.station]
            w.depart(start.item, t)
            return None
        case Consume(job=job, inventory=inv, sku=sku, count=count, t=t):
            start = w.jobs.get(job)
            if start is None or start.t != t:
                return f"job {job} consumes sku {sku}, but didn't just start"
            if (inv, sku) not in w.stocked:
                return f"inventory {inv} doesn't stock sku {sku}"
            supply = ((NodeKind.INVENTORY, inv), (NodeKind.STATION, start.station))
            if supply not in w.edges:
                return f"job {job} draws from inventory {inv}, which doesn't supply station {start.station}"
            level = w.stock.get((inv, sku))
            if level is None or level < count:
                return f"job {job} takes {count} × sku {sku} from inventory {inv}, which has {level}"
            w.stock[(inv, sku)] = level - count
            return None
        case StockLevel(inventory=inv, sku=sku, count=count):
            w.stock[(inv, sku)] = count
            return None if (inv, sku) in w.stocked else f"inventory {inv} doesn't stock sku {sku}"
        case Status(item=item, status=status):
            kind = w.where.get(item, (None, None))[0]
            if kind != NodeKind.QUEUE:
                return f"item {item} gets a status but isn't queued"
            short = bool(w.shortages_of(item))
            if status == ItemState.BLOCKED and not short:
                return f"item {item} is blocked but short of nothing"
            if status == ItemState.WAITING and short:
                return f"item {item} is waiting but still short of parts"
            return None
        case Shortage(item=item, inventory=inv, sku=sku, missing=missing):
            if w.where.get(item, (None, None))[0] != NodeKind.QUEUE:
                return f"item {item} is short of sku {sku} but isn't queued"
            if (inv, sku) not in w.stocked:
                return f"inventory {inv} doesn't stock sku {sku}"
            if missing == 0:
                w.short.pop((item, inv, sku), None)
            else:
                w.short[(item, inv, sku)] = w.stock.get((inv, sku), 0) + missing
            return None
        case _:
            assert_never(e)


def present_events(trace: Trace) -> list[pd.DataFrame]:
    """Every event table the trace has (optional ones may be missing)"""
    tables: list[pd.DataFrame | None] = [getattr(trace, name) for name in EVENT_TABLES]
    return [df for df in tables if df is not None]


def problems(trace: Trace) -> list[str]:
    """Every way `trace` is inconsistent, `[]` if none. Expects schema-validated tables."""
    errors = dangling_references(
        trace.sites,
        trace.queues,
        trace.stations,
        trace.inventories,
        trace.skus,
        trace.inventory_skus,
        trace.edges,
        trace.item_types,
        trace.items,
    )
    errors += [
        f"seq {s} used by several events"
        for s in duplicate_seqs(*present_events(trace))
    ]

    nodes = zip(trace.edges["from_kind"], trace.edges["from_id"], trace.edges["to_kind"], trace.edges["to_id"])
    w = World(
        edges={((NodeKind(fk), int(fi)), (NodeKind(tk), int(ti))) for fk, fi, tk, ti in nodes},
        stocked={(int(i), int(s)) for i, s in zip(trace.inventory_skus["inventory_id"], trace.inventory_skus["sku_id"])},
    )
    end = int(trace.meta["end_sim_time_us"].iloc[0])
    previous_t = 0
    for e in stream(trace):
        if e.t > previous_t:
            # Everything at `previous_t` is in: a shortage still claimed must still be real
            errors += [f"at {previous_t}: {error}" for error in w.covered()]
        if e.t < previous_t:
            errors.append(f"seq {e.seq}: time goes back ({e.t} after {previous_t})")
        if e.t > end:
            errors.append(f"seq {e.seq}: at {e.t}, after the trace's end ({end})")
        previous_t = max(previous_t, e.t)
        if (error := _step(w, e)) is not None:
            errors.append(f"seq {e.seq}: {error}")
    errors += [f"at {previous_t}: {error}" for error in w.covered()]
    return errors


def main() -> None:
    """`python -m flowtrace.validate DIR`: exit 1 and list the problems if the trace is invalid"""
    errors = problems(read_trace(Path(sys.argv[1])))
    for error in errors:
        print(error)
    print(f"{len(errors)} problem(s)" if errors else "ok")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
