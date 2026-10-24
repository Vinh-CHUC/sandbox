"""A whole trace: every static and event table, read from / written to a directory of parquets.

    >>> trace = read_trace(Path("../public/trace"))
    >>> trace.queue_enter.head(1)
       seq  sim_time_us  item_id  queue_id  index
    0    0            0        0         1      0
"""

from dataclasses import dataclass, fields
from pathlib import Path

import pandas as pd
import pandera.pandas as pa

from flowtrace import events as ev
from flowtrace import static as st


@dataclass(frozen=True)
class Trace:
    # Static: the places, written once
    sites: pd.DataFrame
    queues: pd.DataFrame
    stations: pd.DataFrame
    inventories: pd.DataFrame
    skus: pd.DataFrame
    inventory_skus: pd.DataFrame
    edges: pd.DataFrame
    # Events: what happens, ordered by `seq` across all of them
    queue_enter: pd.DataFrame
    queue_leave: pd.DataFrame
    queue_move: pd.DataFrame
    station_start: pd.DataFrame
    station_end: pd.DataFrame
    consumption: pd.DataFrame
    stock: pd.DataFrame
    meta: pd.DataFrame
    # Optional display names
    labels: pd.DataFrame | None = None


# One schema per table, keyed by its file name (without `.parquet`)
SCHEMAS: dict[str, type[pa.DataFrameModel]] = {
    "sites": st.Sites,
    "queues": st.Queues,
    "stations": st.Stations,
    "inventories": st.Inventories,
    "skus": st.Skus,
    "inventory_skus": st.InventorySkus,
    "edges": st.Edges,
    "queue_enter": ev.QueueEnter,
    "queue_leave": ev.QueueLeave,
    "queue_move": ev.QueueMove,
    "station_start": ev.StationStart,
    "station_end": ev.StationEnd,
    "consumption": ev.Consumption,
    "stock": ev.Stock,
    "meta": ev.Meta,
    "labels": st.Labels,
}

EVENT_TABLES = (
    "queue_enter",
    "queue_leave",
    "queue_move",
    "station_start",
    "station_end",
    "consumption",
    "stock",
)


def validated(trace: Trace) -> Trace:
    """Every table checked against (and coerced to) its schema; raises on the first bad table"""
    tables = {
        f.name: SCHEMAS[f.name].validate(df)
        for f in fields(trace)
        if (df := getattr(trace, f.name)) is not None
    }
    return Trace(**tables)


def write_trace(trace: Trace, out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    for f in fields(trace):
        df: pd.DataFrame | None = getattr(trace, f.name)
        if df is not None:
            df.to_parquet(out / f"{f.name}.parquet", index=False)


def read_trace(directory: Path) -> Trace:
    def read(name: str) -> pd.DataFrame | None:
        path = directory / f"{name}.parquet"
        return pd.read_parquet(path) if path.exists() else None

    tables = {f.name: read(f.name) for f in fields(Trace)}
    missing = [name for name, df in tables.items() if df is None and name != "labels"]
    if missing:
        raise FileNotFoundError(f"{directory}: missing {', '.join(missing)}")
    return validated(Trace(**tables))  # pyright: ignore[reportArgumentType]  (checked above)
