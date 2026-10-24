from dataclasses import replace
from pathlib import Path

import pandas as pd
import pytest

from flowtrace.events import FORMAT_VERSION, UNKNOWN
from flowtrace.static import NodeKind
from flowtrace.trace import Trace, read_trace, validated, write_trace
from flowtrace.validate import problems

Q, S, I = NodeKind.QUEUE, NodeKind.STATION, NodeKind.INVENTORY


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
