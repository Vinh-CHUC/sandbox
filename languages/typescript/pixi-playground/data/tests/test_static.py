import pandas as pd
import pandera.errors as pe
import pytest

from flowtrace.static import (
    Edges,
    InventorySkus,
    Labels,
    NodeKind,
    Queues,
    Sites,
    dangling_references,
)

Q, S = NodeKind.QUEUE, NodeKind.STATION
# pandera raises one or the other depending on the failing check
INVALID = (pe.SchemaError, pe.SchemaErrors)


def tables() -> dict[str, pd.DataFrame]:
    """One site: queue 1 → station 10 → queue 2, one inventory stocking SKUs 100 and 200"""
    return {
        "sites": pd.DataFrame({"site_id": [1]}),
        "queues": pd.DataFrame({"queue_id": [1, 2], "site_id": [1, 1]}),
        "stations": pd.DataFrame({"station_id": [10], "site_id": [1]}),
        "inventories": pd.DataFrame({"inventory_id": [5], "site_id": [1]}),
        "skus": pd.DataFrame({"sku_id": [100, 200]}),
        "inventory_skus": pd.DataFrame({"inventory_id": [5, 5], "sku_id": [200, 100]}),
        "edges": pd.DataFrame(
            {"from_kind": [Q, S], "from_id": [1, 10], "to_kind": [S, Q], "to_id": [10, 2]}
        ),
    }


def test_valid_tables_pass_and_coerce() -> None:
    t = tables()
    assert Queues.validate(t["queues"])["queue_id"].dtype == "UInt32"
    assert dangling_references(**t) == []


def test_ids_are_unique() -> None:
    with pytest.raises(INVALID):
        Sites.validate(pd.DataFrame({"site_id": [1, 1]}))


def test_extra_columns_are_rejected_also_in_subclassed_configs() -> None:
    # InventorySkus overrides Config for `unique`: `strict` must still apply
    with pytest.raises(INVALID):
        InventorySkus.validate(
            pd.DataFrame({"inventory_id": [5], "sku_id": [100], "x_position": [0.0]})
        )


def test_an_inventory_stocks_a_sku_once() -> None:
    with pytest.raises(INVALID):
        InventorySkus.validate(pd.DataFrame({"inventory_id": [5, 5], "sku_id": [100, 100]}))


def test_edge_kinds_are_known() -> None:
    with pytest.raises(INVALID):
        Edges.validate(
            pd.DataFrame({"from_kind": [7], "from_id": [1], "to_kind": [S], "to_id": [10]})
        )


def test_labels_only_for_known_tables() -> None:
    Labels.validate(pd.DataFrame({"table": ["skus"], "id": [100], "label": ["wheel"]}))
    with pytest.raises(INVALID):
        Labels.validate(pd.DataFrame({"table": ["nope"], "id": [1], "label": ["?"]}))


def test_dangling_references_are_reported() -> None:
    t = tables()
    t["queues"] = t["queues"].assign(site_id=[1, 9])
    t["edges"] = t["edges"].assign(to_id=[11, 2])
    assert dangling_references(**t) == [
        "queues.site_id 9 not in sites",
        "edges.to_id 11 not a station",
    ]
