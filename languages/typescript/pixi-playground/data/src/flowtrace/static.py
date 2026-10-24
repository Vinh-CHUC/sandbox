"""Static tables of a flow trace: the places things flow between, written once per trace.

Places are drawn at fixed positions, so the viewer needs all of them before playback: sites,
queues, stations, inventories and the SKUs each inventory stocks. Items (the things that move)
are not static: they are discovered from the event tables.

Columns are scalar, numeric ids only (`labels` aside), so every table is also publishable by
lattice's generic parquet publisher.

    >>> Sites.validate(pd.DataFrame({"site_id": [1, 2]}))
       site_id
    0        1
    1        2
"""

from enum import IntEnum

import pandas as pd
import pandera.pandas as pa
from pandera.typing.pandas import Series

from flowtrace.base import Table


class NodeKind(IntEnum):
    """What an edge endpoint refers to: `edges.{from,to}_kind`"""

    QUEUE = 0
    STATION = 1
    # Only as a `from`: an inventory → station edge means "supplies", i.e. the station's jobs
    # may draw from that inventory
    INVENTORY = 2


class Sites(Table):
    """Groups of places, e.g. a depot"""

    site_id: Series[pd.UInt32Dtype] = pa.Field(unique=True)


class Queues(Table):
    queue_id: Series[pd.UInt32Dtype] = pa.Field(unique=True)
    site_id: Series[pd.UInt32Dtype]


class Stations(Table):
    """Where items get processed, one at a time"""

    station_id: Series[pd.UInt32Dtype] = pa.Field(unique=True)
    site_id: Series[pd.UInt32Dtype]


class Inventories(Table):
    """A stockpile of SKUs at a site"""

    inventory_id: Series[pd.UInt32Dtype] = pa.Field(unique=True)
    site_id: Series[pd.UInt32Dtype]


class Skus(Table):
    """The catalogue of stock-keeping units (part types); int64 to fit e.g. NSNs"""

    sku_id: Series[pd.Int64Dtype] = pa.Field(unique=True)


class InventorySkus(Table):
    """What each inventory stocks. Row order is stack order, so the layout is fixed up front."""

    inventory_id: Series[pd.UInt32Dtype]
    sku_id: Series[pd.Int64Dtype]

    class Config:  # pyright: ignore[reportIncompatibleVariableOverride]
        unique = ["inventory_id", "sku_id"]


class Edges(Table):
    """
    Directed flow between places, see `NodeKind`: items move queue ↔ station (and queue → queue),
    parts move inventory → station ("supplies"). A description, not the truth: events alone drive
    replay; edges are for drawing, layout, and validating that every move follows one.
    """

    from_kind: Series[pd.UInt8Dtype] = pa.Field(isin=[k.value for k in NodeKind])
    from_id: Series[pd.UInt32Dtype]
    to_kind: Series[pd.UInt8Dtype] = pa.Field(isin=[k.value for k in NodeKind])
    to_id: Series[pd.UInt32Dtype]

    class Config:  # pyright: ignore[reportIncompatibleVariableOverride]
        unique = ["from_kind", "from_id", "to_kind", "to_id"]


LABELLED_TABLES = ("sites", "queues", "stations", "inventories", "skus", "items")


class Labels(Table):
    """
    Optional display names, the only strings in a trace (so not lattice-publishable: write it
    separately, e.g. from config). `id` is the row's id in `table`.
    """

    table: Series[str] = pa.Field(isin=list(LABELLED_TABLES))
    id: Series[pd.Int64Dtype]
    label: Series[str]

    class Config:  # pyright: ignore[reportIncompatibleVariableOverride]
        unique = ["table", "id"]


def dangling_references(
    sites: pd.DataFrame,
    queues: pd.DataFrame,
    stations: pd.DataFrame,
    inventories: pd.DataFrame,
    skus: pd.DataFrame,
    inventory_skus: pd.DataFrame,
    edges: pd.DataFrame,
) -> list[str]:
    """
    Cross-table checks pandera can't express on one frame: every id a table refers to exists.

        >>> dangling_references(sites, queues.assign(site_id=9), ...)
        ['queues.site_id 9 not in sites']
    """
    nodes = {
        NodeKind.QUEUE: set(queues["queue_id"]),
        NodeKind.STATION: set(stations["station_id"]),
        NodeKind.INVENTORY: set(inventories["inventory_id"]),
    }
    checks = [
        ("queues.site_id", queues["site_id"], set(sites["site_id"]), "sites"),
        ("stations.site_id", stations["site_id"], set(sites["site_id"]), "sites"),
        ("inventories.site_id", inventories["site_id"], set(sites["site_id"]), "sites"),
        (
            "inventory_skus.inventory_id",
            inventory_skus["inventory_id"],
            set(inventories["inventory_id"]),
            "inventories",
        ),
        ("inventory_skus.sku_id", inventory_skus["sku_id"], set(skus["sku_id"]), "skus"),
    ]
    errors = [
        f"{column} {value} not in {table}"
        for column, values, known, table in checks
        for value in values
        if value not in known
    ]
    for end in ("from", "to"):
        for kind, node_id in zip(edges[f"{end}_kind"], edges[f"{end}_id"]):
            if node_id not in nodes[NodeKind(kind)]:
                errors.append(f"edges.{end}_id {node_id} not a {NodeKind(kind).name.lower()}")
    return errors
