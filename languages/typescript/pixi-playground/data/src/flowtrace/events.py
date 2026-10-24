"""Event tables of a flow trace: what happens, in order. Replaying them rebuilds the state.

Every table starts with `seq` (one total order across *all* event tables, so events at the same
time replay deterministically) and `sim_time_us` (µs since the start of the simulation). Items
exist from their first event on; one with no further event has left the world.

How moves read, in `seq` order:
- `queue_leave` → `station_start`: an item goes from its queue to a station
- `station_end` → `queue_enter`: from a station into a queue

"Unknown" is a -1 sentinel rather than null, as scalar-only publishers can't write nulls.
"""

from enum import IntEnum

import pandas as pd
import pandera.pandas as pa
from pandera.typing.pandas import Series

from flowtrace.base import Table

FORMAT_VERSION = 1
UNKNOWN = -1


class ItemState(IntEnum):
    """`item_status.status`: how a queued item is doing"""

    WAITING = 0
    # Can't be served yet: the parts it needs aren't in stock
    BLOCKED = 1


class Event(Table):
    seq: Series[pd.Int64Dtype] = pa.Field(ge=0, unique=True)
    sim_time_us: Series[pd.Int64Dtype] = pa.Field(ge=0)


class QueueEnter(Event):
    """`item_id` joins `queue_id` at `index` (0 = head) of the queue as it is at that moment"""

    item_id: Series[pd.UInt32Dtype]
    queue_id: Series[pd.UInt32Dtype]
    index: Series[pd.UInt32Dtype]


class QueueLeave(Event):
    """`item_id` leaves `queue_id`, from wherever it is in it"""

    item_id: Series[pd.UInt32Dtype]
    queue_id: Series[pd.UInt32Dtype]


class QueueMove(Event):
    """`item_id` moves to `index` within `queue_id`, e.g. re-prioritised while waiting"""

    item_id: Series[pd.UInt32Dtype]
    queue_id: Series[pd.UInt32Dtype]
    index: Series[pd.UInt32Dtype]


class StationStart(Event):
    """A job: `item_id` occupies `station_id` until the matching `station_end`"""

    job_id: Series[pd.UInt32Dtype] = pa.Field(unique=True)
    item_id: Series[pd.UInt32Dtype]
    station_id: Series[pd.UInt32Dtype]
    # -1 (UNKNOWN) when the job's length isn't known up front; the viewer then shows no progress
    expected_duration_us: Series[pd.Int64Dtype] = pa.Field(ge=UNKNOWN)


class StationEnd(Event):
    """The job is over: its station is free again"""

    job_id: Series[pd.UInt32Dtype] = pa.Field(unique=True)


class Consumption(Event):
    """SKUs a job takes from an inventory, at its start"""

    job_id: Series[pd.UInt32Dtype]
    inventory_id: Series[pd.UInt32Dtype]
    sku_id: Series[pd.Int64Dtype]
    count: Series[pd.UInt32Dtype] = pa.Field(ge=1)

    class Config:  # pyright: ignore[reportIncompatibleVariableOverride]
        unique = ["job_id", "inventory_id", "sku_id"]


class Stock(Event):
    """
    Stock *level* of a SKU in an inventory, written when it changes; one row per
    `inventory_skus` entry at t = 0 gives the initial stock. Levels (not deltas) so a reader can
    start anywhere.
    """

    inventory_id: Series[pd.UInt32Dtype]
    sku_id: Series[pd.Int64Dtype]
    count: Series[pd.UInt32Dtype]


class ItemStatus(Event):
    """
    A queued item's state *level*, written when it changes (see `ItemState`); items are WAITING
    until told otherwise. Optional table.
    """

    item_id: Series[pd.UInt32Dtype]
    status: Series[pd.UInt8Dtype] = pa.Field(isin=[s.value for s in ItemState])


class ItemShortage(Event):
    """
    How many of a SKU a queued item is short of, *level*, written when it changes (0 clears it).
    A BLOCKED item has at least one; the stock levels must back it up (see the validator).
    Optional table.
    """

    item_id: Series[pd.UInt32Dtype]
    inventory_id: Series[pd.UInt32Dtype]
    sku_id: Series[pd.Int64Dtype]
    missing: Series[pd.UInt32Dtype]


class Meta(Table):
    """One row describing the whole trace"""

    format_version: Series[pd.UInt16Dtype] = pa.Field(eq=FORMAT_VERSION)
    # Wall-clock time of sim_time_us = 0, for display only
    start_unix_us: Series[pd.Int64Dtype]
    end_sim_time_us: Series[pd.Int64Dtype] = pa.Field(ge=0)

    @pa.dataframe_check  # pyright: ignore[reportUnknownMemberType]  (untyped in pandera)
    @classmethod
    def one_row(cls, df: pd.DataFrame) -> bool:
        return len(df) == 1


def duplicate_seqs(*tables: pd.DataFrame) -> list[int]:
    """
    `seq` must be unique across all event tables, not only within each.

        >>> duplicate_seqs(pd.DataFrame({"seq": [0, 1]}), pd.DataFrame({"seq": [1, 2]}))
        [1]
    """
    seqs = pd.concat([t["seq"] for t in tables], ignore_index=True)
    return sorted(int(s) for s in seqs[seqs.duplicated()].unique())
