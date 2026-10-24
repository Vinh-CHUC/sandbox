import subprocess
import sys
from pathlib import Path

import pandas as pd
import pytest

from flowtrace.events import UNKNOWN
from flowtrace.generate import Config, simulate
from flowtrace.trace import read_trace
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
    # Items come back for another round: same item enters the same queue again
    assert t.queue_enter.duplicated(["item_id", "queue_id"]).any()
    # Repairs draw stock down below where it started
    assert (t.stock["count"] < Config().initial_stock).any()


def test_cli_writes_a_readable_trace(tmp_path: Path) -> None:
    subprocess.run(
        [sys.executable, "-m", "flowtrace.generate", "--out", str(tmp_path), "--hours", "2"],
        check=True,
        capture_output=True,
    )
    assert problems(read_trace(tmp_path)) == []


def test_each_stage_draws_from_its_own_inventory() -> None:
    t = simulate(Config(hours=12), 1)
    used = t.consumption.merge(t.station_start[["job_id", "station_id"]], on="job_id")
    supplies = t.edges[t.edges["from_kind"] == 2]
    pairs = set(zip(supplies["from_id"], supplies["to_id"]))
    assert all(pair in pairs for pair in zip(used["inventory_id"], used["station_id"]))
    # Both stages consume: one inventory per queue, and each gets used
    assert set(used["inventory_id"]) == set(t.queues["queue_id"])


def test_repairs_can_leave_their_length_unknown() -> None:
    t = simulate(Config(hours=2, repair_duration_known=False), 1)
    expected = t.station_start["expected_duration_us"]
    assert (expected == UNKNOWN).any()  # repairs
    assert (expected > 0).any()  # inspections
    assert problems(t) == []
