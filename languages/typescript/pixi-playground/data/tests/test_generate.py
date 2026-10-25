import json
import subprocess
import sys
from dataclasses import replace
from pathlib import Path

import pandas as pd
import pytest

from flowtrace.events import UNKNOWN, ItemState
from flowtrace.static import NO_SITE
from flowtrace.generate import (
    SCENARIOS,
    US_PER_MIN,
    Config,
    RoadConfig,
    StageConfig,
    layout,
    simulate,
)
from flowtrace.trace import Trace, read_trace
from flowtrace.validate import problems


@pytest.mark.parametrize("seed", [1, 2, 3, 4, 5])
def test_every_seed_gives_a_consistent_trace(seed: int) -> None:
    assert problems(simulate(Config(hours=12), seed)) == []


def test_same_seed_same_trace() -> None:
    a, b = simulate(Config(), 7), simulate(Config(), 7)
    pd.testing.assert_frame_equal(a.queue_enter, b.queue_enter)
    pd.testing.assert_frame_equal(a.stock, b.stock)


def test_exercises_every_feature_the_viewer_handles() -> None:
    t = simulate(Config(hours=12), 1)
    assert len(t.queue_move) > 0  # priority bumps
    assert len(t.consumption) > 0
    assert (t.station_start["expected_duration_us"] > 0).all()  # every job's length is known
    # Items keep arriving after the initial backlog
    assert (t.queue_enter["sim_time_us"] > 0).any()
    # Jobs draw stock down below where it started
    assert (t.stock["count"] < Config().initial_stock).any()


def test_cli_writes_a_readable_trace_per_scenario(tmp_path: Path) -> None:
    subprocess.run(
        [sys.executable, "-m", "flowtrace.generate", "--out", str(tmp_path), "--hours", "2"],
        check=True,
        capture_output=True,
    )
    assert json.loads((tmp_path / "index.json").read_text()) == list(SCENARIOS)
    for name in SCENARIOS:
        assert problems(read_trace(tmp_path / name)) == []


@pytest.mark.parametrize("name", SCENARIOS)
def test_every_scenario_gives_a_consistent_trace(name: str) -> None:
    t = simulate(replace(SCENARIOS[name], hours=6), 1)
    assert problems(t) == []
    assert len(t.sites) == SCENARIOS[name].sites
    assert (t.roads is not None) == (name == "road")


def test_a_road_ships_stock_from_one_end_to_the_other() -> None:
    cfg = SCENARIOS["road"]
    assert cfg.road is not None
    t = simulate(cfg, 1)
    assert t.roads is not None and t.road_enter is not None and t.road_leave is not None
    road = t.roads.iloc[0]
    ends = {int(road["a_inventory_id"]), int(road["b_inventory_id"])}
    trips = t.road_enter.merge(t.road_leave, on="shipment_id", suffixes=("", "_arrived"))
    assert len(trips) > 5
    assert set(trips["from_inventory_id"]) <= ends
    # length / speed minutes each
    assert (trips["sim_time_us_arrived"] - trips["sim_time_us"] == cfg.road.length * US_PER_MIN).all()
    # The other end's stock rises by the batch as it arrives
    levels = t.stock.sort_values("seq").assign(count=lambda d: d["count"].astype("int64"))
    rises = levels.assign(rise=levels.groupby(["inventory_id", "sku_id"])["count"].diff())
    for source, sku, count, t in zip(
        trips["from_inventory_id"], trips["sku_id"], trips["count"], trips["sim_time_us_arrived"]
    ):
        to = (ends - {int(source)}).pop()
        at = (rises["sim_time_us"] == t) & (rises["inventory_id"] == to) & (rises["sku_id"] == sku)
        # The first change then: a job may draw on it at the same instant
        assert list(rises.loc[at, "rise"])[0] == count
    assert (trips["count"] <= cfg.road.batch).all()


def test_routine_shipments_keep_traffic_going_without_shortages() -> None:
    # Plenty of everything: nothing ever runs short, yet stock travels both ways
    plenty = Config(hours=6, sites=2, road=RoadConfig(), initial_stock=1000, reorder_point=6)
    t = simulate(plenty, 1)
    assert t.road_enter is not None and t.item_shortage is not None
    assert len(t.item_shortage) == 0
    assert len(t.road_enter) > 10
    assert t.road_enter["from_inventory_id"].nunique() == 2
    assert problems(t) == []
    # And none when asked for none
    quiet = simulate(replace(plenty, road=RoadConfig(routine_every_min=0)), 1)
    assert quiet.road_enter is not None and len(quiet.road_enter) == 0


def test_no_road_without_two_sites() -> None:
    t = simulate(Config(hours=2, sites=1, road=RoadConfig()), 1)
    assert t.roads is None and t.road_enter is None


def test_each_stage_draws_from_its_own_inventory() -> None:
    t = simulate(Config(hours=12), 1)
    used = t.consumption.merge(t.station_start[["job_id", "station_id"]], on="job_id")
    supplies = t.edges[t.edges["from_kind"] == 2]
    pairs = set(zip(supplies["from_id"], supplies["to_id"]))
    assert all(pair in pairs for pair in zip(used["inventory_id"], used["station_id"]))
    # Both stages consume: one inventory per queue, and each gets used
    assert set(used["inventory_id"]) == set(t.inventories["inventory_id"])


def test_a_stage_can_leave_its_jobs_length_unknown() -> None:
    stages = (StageConfig(stations=2), StageConfig(stations=3, slowdown=3, duration_known=False))
    t = simulate(Config(hours=2, stages=stages), 1)
    expected = t.station_start["expected_duration_us"]
    assert (expected == UNKNOWN).any()  # second stage
    assert (expected > 0).any()  # first stage
    assert problems(t) == []


def test_items_short_of_parts_are_marked_blocked_then_released() -> None:
    t = simulate(Config(hours=8), 1)
    assert t.item_status is not None
    states = t.item_status.groupby("item_id")["status"].apply(list)
    assert (t.item_status["status"] == ItemState.BLOCKED).any()
    # Only changes are written: each item's states alternate, starting from blocked
    for item_states in states:
        assert item_states[0] == ItemState.BLOCKED
        assert all(a != b for a, b in zip(item_states, item_states[1:]))


def test_any_number_of_stages() -> None:
    three = (StageConfig(stations=1), StageConfig(stations=2), StageConfig(stations=1, slowdown=2))
    t = simulate(Config(hours=3, sites=1, stages=three), 2)
    assert len(t.queues) == 3 + 1  # and the store
    assert problems(t) == []
    # Items make it all the way through: some finish a job in the last stage's stations
    last = t.edges[(t.edges["from_kind"] == 0) & (t.edges["from_id"] == 3)]["to_id"]
    finished = t.station_end.merge(t.station_start[["job_id", "station_id"]], on="job_id")
    assert finished["station_id"].isin(last).any()


def _stores(t: Trace) -> set[int]:
    """Queues that feed no station"""
    feeding = t.edges[(t.edges["from_kind"] == 0) & (t.edges["to_kind"] == 1)]["from_id"]
    return set(t.queues["queue_id"]) - set(feeding)


def test_one_store_outside_every_site_a_sink() -> None:
    t = simulate(Config(hours=4), 1)
    stores = _stores(t)
    assert len(stores) == 1
    store_site = t.queues[t.queues["queue_id"].isin(stores)]["site_id"]
    assert list(store_site) == [NO_SITE]
    assert t.queue_enter["queue_id"].isin(stores).sum() > 0  # items end up there…
    assert not t.queue_leave["queue_id"].isin(stores).any()  # …and stay
    assert problems(t) == []


def test_a_good_share_skip_straight_to_the_store_or_sit_blocked() -> None:
    t = simulate(Config(), 1)
    stores = _stores(t)
    # After a first-stage job, some items go straight to the store
    first_queues = {site.stages[0].queue for site in layout(Config())[0]}
    first_stations = t.edges[(t.edges["from_kind"] == 0) & t.edges["from_id"].isin(first_queues)]
    ends = t.station_end.merge(t.station_start[["job_id", "item_id", "station_id"]], on="job_id")
    ends = ends[ends["station_id"].isin(first_stations["to_id"])]
    nxt = ends.merge(t.queue_enter, on=["item_id", "sim_time_us"])
    assert 0.25 < nxt["queue_id"].isin(stores).mean() < 0.6
    # Blocked spells are common, and long enough to see
    st = t.item_status.sort_values("seq") if t.item_status is not None else None
    assert st is not None
    spells = [
        (b[0] - a[0]) / 6e7
        for _, g in st.groupby("item_id")
        for a, b in zip(g[["sim_time_us", "status"]].values, g[["sim_time_us", "status"]].values[1:])
        if a[1] == ItemState.BLOCKED and b[1] == ItemState.WAITING
    ]
    assert len(spells) > 100
    assert sorted(spells)[len(spells) // 2] >= 5  # median spell, in minutes


def test_blocked_items_say_which_parts_they_miss() -> None:
    t = simulate(Config(), 1)
    assert t.item_shortage is not None and len(t.item_shortage) > 0
    # The validator holds them to the stock levels: blocked ⇔ short, and shortages are real
    assert problems(t) == []


def test_some_skus_run_out_far_more_than_others() -> None:
    t = simulate(Config(), 1)
    assert t.items is not None
    # Within the most common type (1), whose favourite is the first SKU and least favourite the last
    used = t.consumption.merge(t.station_start[["job_id", "item_id"]], on="job_id").merge(
        t.items, on="item_id"
    )
    type_1 = used[used["item_type_id"] == 1].groupby("sku_id")["count"].sum()
    skus = sorted(t.skus["sku_id"])
    assert type_1.get(skus[0], 0) > 3 * type_1.get(skus[-1], 0)
    # And items do run short, of the parts in demand
    assert t.item_shortage is not None
    assert (t.item_shortage["missing"] > 0).sum() > 50


def test_stock_is_reordered_when_low_arriving_after_a_lead_time() -> None:
    cfg = Config()
    t = simulate(cfg, 1)
    levels = t.stock.sort_values("seq")
    # Signed, or a drop would wrap around
    change = levels.assign(count=levels["count"].astype("int64")).groupby(
        ["inventory_id", "sku_id"]
    )["count"].diff()
    rises = change[change > 0]
    assert len(rises) > 0  # restocks happen…
    assert (rises == cfg.order_size).all()  # …each by an order's worth
    # …at their own times: not all of a site's SKUs topped up at once, as a fixed delivery would
    restock_times = levels.loc[rises.index, "sim_time_us"]
    assert restock_times.nunique() > len(rises) / 2


def test_items_have_types_that_wear_out_different_parts() -> None:
    t = simulate(Config(), 1)
    assert t.items is not None and t.item_types is not None
    assert set(t.items["item_type_id"]) == set(t.item_types["item_type_id"])
    # Every item that ever queued has a type
    assert set(t.queue_enter["item_id"]) <= set(t.items["item_id"])
    # Each type's most used SKU differs from the next type's
    used = t.consumption.merge(t.station_start[["job_id", "item_id"]], on="job_id").merge(
        t.items, on="item_id"
    )
    favourite = used.groupby(["item_type_id", "sku_id"])["count"].sum().groupby(level=0).idxmax()
    assert len({sku for _, sku in favourite}) == len(favourite)
