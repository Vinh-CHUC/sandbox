"""Static tables of a flow trace: the places things flow between, written once per trace.

Places are drawn at fixed positions, so the viewer needs all of them before playback: sites,
queues, stations, inventories and the SKUs each inventory stocks. Items (the things that move)
are not static: they are discovered from the event tables.

Columns are scalar, numeric ids only (`labels` aside): the most a typical columnar publisher (one
row per entity, flat scalar fields) can produce, so a real simulation's output can be mapped here.

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


# A place's `site_id` when it belongs to no site, e.g. a store shared by every site (site ids start
# at 1, so 0 is free)
NO_SITE = 0


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
    """The catalogue of stock-keeping units (part types); int64 to fit large external codes"""

    sku_id: Series[pd.Int64Dtype] = pa.Field(unique=True)


class ItemTypes(Table):
    """The catalogue of item types (e.g. models of a product). Optional, like `Items`."""

    item_type_id: Series[pd.UInt32Dtype] = pa.Field(unique=True)


class Items(Table):
    """What type each item is: a type never changes, so it's static. Optional; items not listed
    are untyped."""

    item_id: Series[pd.UInt32Dtype] = pa.Field(unique=True)
    item_type_id: Series[pd.UInt32Dtype]


class InventorySkus(Table):
    """What each inventory stocks. Row order is stack order, so the layout is fixed up front."""

    inventory_id: Series[pd.UInt32Dtype]
    sku_id: Series[pd.Int64Dtype]

    class Config:  # pyright: ignore[reportIncompatibleVariableOverride]
        unique = ["inventory_id", "sku_id"]


class Roads(Table):
    """
    A two-way road between two inventories, `length` grid cells long: stock travels it in
    shipments (`road_enter` / `road_leave`). Optional table.
    """

    road_id: Series[pd.UInt32Dtype] = pa.Field(unique=True)
    a_inventory_id: Series[pd.UInt32Dtype]
    b_inventory_id: Series[pd.UInt32Dtype]
    length: Series[pd.UInt32Dtype] = pa.Field(ge=1)


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


LABELLED_TABLES = (
    "sites",
    "queues",
    "stations",
    "inventories",
    "skus",
    "items",
    "item_types",
    "roads",
)


class Labels(Table):
    """
    Optional display names, the only strings in a trace (scalar-only publishers can't write it:
    write it separately, e.g. from config). `id` is the row's id in `table`. The viewer's
    `labels.json` takes precedence.
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
    item_types: pd.DataFrame | None = None,
    items: pd.DataFrame | None = None,
    roads: pd.DataFrame | None = None,
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
        ("queues.site_id", queues["site_id"], {NO_SITE, *sites["site_id"]}, "sites"),
        ("stations.site_id", stations["site_id"], {NO_SITE, *sites["site_id"]}, "sites"),
        ("inventories.site_id", inventories["site_id"], {NO_SITE, *sites["site_id"]}, "sites"),
        (
            "inventory_skus.inventory_id",
            inventory_skus["inventory_id"],
            set(inventories["inventory_id"]),
            "inventories",
        ),
        ("inventory_skus.sku_id", inventory_skus["sku_id"], set(skus["sku_id"]), "skus"),
    ]
    if items is not None:
        known_types: set[int] = (
            set() if item_types is None else {int(t) for t in item_types["item_type_id"]}
        )
        checks.append(("items.item_type_id", items["item_type_id"], known_types, "item_types"))
    if roads is not None:
        checks += [
            (f"roads.{end}_inventory_id", roads[f"{end}_inventory_id"], nodes[NodeKind.INVENTORY], "inventories")
            for end in ("a", "b")
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
