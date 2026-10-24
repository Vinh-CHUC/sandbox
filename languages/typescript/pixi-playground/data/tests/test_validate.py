from dataclasses import replace
from pathlib import Path

import pandas as pd
import pytest

from flowtrace.events import FORMAT_VERSION, UNKNOWN, ItemShortage, ItemStatus
from flowtrace.static import NodeKind
from flowtrace.trace import Trace, read_trace, validated, write_trace
from flowtrace.validate import problems

Q, S, I = NodeKind.QUEUE, NodeKind.STATION, NodeKind.INVENTORY


def validated_status(df: pd.DataFrame) -> pd.DataFrame:
    return ItemStatus.validate(df)


def valid_trace() -> Trace:
    """
    queue 1 → station 10 → queue 2, inventory 5 (stocking SKUs 100 and 200) supplying station 10.
    Item 2 overtakes item 1, gets processed taking 2 × SKU 100, then lands in queue 2.
    """
    return validated(
        Trace(
            sites=pd.DataFrame({"site_id": [1]}),
            queues=pd.DataFrame({"queue_id": [1, 2], "site_id": [1, 1]}),
            stations=pd.DataFrame({"station_id": [10], "site_id": [1]}),
            inventories=pd.DataFrame({"inventory_id": [5], "site_id": [1]}),
            skus=pd.DataFrame({"sku_id": [100, 200]}),
            inventory_skus=pd.DataFrame({"inventory_id": [5, 5], "sku_id": [100, 200]}),
            edges=pd.DataFrame(
                {
                    "from_kind": [Q, S, I],
                    "from_id": [1, 10, 5],
                    "to_kind": [S, Q, S],
                    "to_id": [10, 2, 10],
                }
            ),
            stock=pd.DataFrame(
                {
                    "seq": [0, 1, 8],
                    "sim_time_us": [0, 0, 1000],
                    "inventory_id": [5, 5, 5],
                    "sku_id": [100, 200, 100],
                    "count": [3, 3, 1],
                }
            ),
            queue_enter=pd.DataFrame(
                {
                    "seq": [2, 3, 10],
                    "sim_time_us": [0, 0, 2000],
                    "item_id": [1, 2, 2],
                    "queue_id": [1, 1, 2],
                    "index": [0, 1, 0],
                }
            ),
            queue_move=pd.DataFrame(
                {"seq": [4], "sim_time_us": [500], "item_id": [2], "queue_id": [1], "index": [0]}
            ),
            queue_leave=pd.DataFrame(
                {"seq": [5], "sim_time_us": [1000], "item_id": [2], "queue_id": [1]}
            ),
            station_start=pd.DataFrame(
                {
                    "seq": [6],
                    "sim_time_us": [1000],
                    "job_id": [1],
                    "item_id": [2],
                    "station_id": [10],
                    "expected_duration_us": [UNKNOWN],
                }
            ),
            consumption=pd.DataFrame(
                {
                    "seq": [7],
                    "sim_time_us": [1000],
                    "job_id": [1],
                    "inventory_id": [5],
                    "sku_id": [100],
                    "count": [2],
                }
            ),
            station_end=pd.DataFrame({"seq": [9], "sim_time_us": [2000], "job_id": [1]}),
            meta=pd.DataFrame(
                {"format_version": [FORMAT_VERSION], "start_unix_us": [0], "end_sim_time_us": [3000]}
            ),
        )
    )


def test_a_consistent_trace_has_no_problems() -> None:
    assert problems(valid_trace()) == []


def test_a_same_time_move_must_follow_an_edge() -> None:
    t = valid_trace()
    no_exit_edge = replace(t, edges=t.edges.drop(index=1))  # station 10 → queue 2 gone
    assert problems(no_exit_edge) == [
        "seq 10: item 2 moves station 10 → queue 2, but there is no such edge"
    ]


def test_arriving_later_comes_from_outside_and_needs_no_edge() -> None:
    t = valid_trace()
    later = replace(
        t,
        edges=t.edges.drop(index=1),
        queue_enter=t.queue_enter.assign(sim_time_us=[0, 0, 2500]),
    )
    assert problems(later) == []


def test_an_item_is_in_one_place_at_a_time() -> None:
    t = valid_trace()
    twice = pd.concat(
        [t.queue_enter, pd.DataFrame({"seq": [11], "sim_time_us": [2500], "item_id": [1], "queue_id": [2], "index": [1]})]
    )
    assert problems(replace(t, queue_enter=twice)) == [
        "seq 11: item 1 arrives at queue 2 but is already in queue 1"
    ]


@pytest.mark.parametrize(
    "table, change, expected",
    [
        ("consumption", {"count": [4]}, "seq 7: job 1 takes 4 × sku 100 from inventory 5, which has 3"),
        ("consumption", {"sim_time_us": [1500]}, "seq 7: job 1 consumes sku 100, but didn't just start"),
        ("station_end", {"job_id": [2]}, "seq 9: job 2 ends but isn't running"),
        ("queue_move", {"index": [2]}, "seq 4: item 2 moves to 2 in queue 1, past its end (2)"),
        ("queue_leave", {"item_id": [3]}, "seq 5: item 3 leaves queue 1 but isn't in it"),
    ],
)
def test_inconsistent_events_are_reported(
    table: str, change: dict[str, list[int]], expected: str
) -> None:
    t = valid_trace()
    broken = replace(t, **{table: getattr(t, table).assign(**change)})
    assert expected in problems(broken)


def test_status_only_for_queued_items() -> None:
    t = valid_trace()
    # At the end, item 1 is still in queue 1; item 3 never existed
    statuses = pd.DataFrame(
        {"seq": [11, 12], "sim_time_us": [2500, 2500], "item_id": [1, 3], "status": [0, 0]}
    )
    assert problems(replace(t, item_status=validated_status(statuses))) == [
        "seq 12: item 3 gets a status but isn't queued"
    ]


def _shortages(rows: list[tuple[int, int, int, int, int, int]]) -> pd.DataFrame:
    return ItemShortage.validate(
        pd.DataFrame(
            rows, columns=["seq", "sim_time_us", "item_id", "inventory_id", "sku_id", "missing"]
        )
    )


def _statuses(rows: list[tuple[int, int, int, int]]) -> pd.DataFrame:
    return ItemStatus.validate(pd.DataFrame(rows, columns=["seq", "sim_time_us", "item_id", "status"]))


def test_blocked_means_short_of_something() -> None:
    t = valid_trace()
    blocked = replace(t, item_status=_statuses([(11, 2500, 1, 1)]))
    assert problems(blocked) == ["seq 11: item 1 is blocked but short of nothing"]
    # Short of 200: stock has 3 of SKU 200, item 1 needs 5
    short = replace(
        t,
        item_shortage=_shortages([(11, 2500, 1, 5, 200, 2)]),
        item_status=_statuses([(12, 2500, 1, 1)]),
    )
    assert problems(short) == []


def test_a_shortage_must_be_real_while_claimed() -> None:
    t = valid_trace()
    # Item 1 claims 2 short of SKU 200 (stock 3, so it needs 5)…
    claim = _shortages([(11, 2500, 1, 5, 200, 2)])
    # …then SKU 200 is restocked to 9, but the claim isn't cleared
    restock = pd.concat(
        [t.stock, pd.DataFrame({"seq": [12], "sim_time_us": [2600], "inventory_id": [5], "sku_id": [200], "count": [9]})]
    )
    assert problems(replace(t, item_shortage=claim, stock=restock)) == [
        "at 2600: item 1 is still short of sku 200 but inventory 5 has 9 (needs 5)"
    ]


def test_an_item_cant_leave_its_queue_still_short() -> None:
    t = valid_trace()
    # Item 2 becomes short of SKU 100 at seq 4 (in place of the queue_move), then leaves at seq 5
    no_move = t.queue_move.iloc[0:0]
    claim = _shortages([(4, 500, 2, 5, 100, 1)])
    assert problems(replace(t, queue_move=no_move, item_shortage=claim)) == [
        "seq 5: item 2 leaves queue 1 while still short of parts"
    ]


def test_consumption_needs_a_supply_edge() -> None:
    t = valid_trace()
    unsupplied = replace(t, edges=t.edges.drop(index=2))  # inventory 5 → station 10 gone
    assert problems(unsupplied) == [
        "seq 7: job 1 draws from inventory 5, which doesn't supply station 10"
    ]


def test_time_never_goes_back_in_seq_order() -> None:
    t = valid_trace()
    broken = replace(t, queue_leave=t.queue_leave.assign(sim_time_us=[400]))
    assert "seq 5: time goes back (400 after 500)" in problems(broken)


def test_seq_is_unique_across_tables() -> None:
    t = valid_trace()
    broken = replace(t, station_end=t.station_end.assign(seq=[8]))
    assert "seq 8 used by several events" in problems(broken)


def test_parquet_round_trip(tmp_path: Path) -> None:
    write_trace(valid_trace(), tmp_path)
    assert problems(read_trace(tmp_path)) == []
