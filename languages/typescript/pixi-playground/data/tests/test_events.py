import pandas as pd
import pandera.errors as pe
import pytest

from flowtrace.events import (
    FORMAT_VERSION,
    UNKNOWN,
    Consumption,
    Meta,
    QueueEnter,
    StationEnd,
    StationStart,
    duplicate_seqs,
)

INVALID = (pe.SchemaError, pe.SchemaErrors)


def test_events_carry_seq_and_time() -> None:
    df = QueueEnter.validate(
        pd.DataFrame({"seq": [0], "sim_time_us": [0], "item_id": [1], "queue_id": [2], "index": [0]})
    )
    assert list(df.columns) == ["seq", "sim_time_us", "item_id", "queue_id", "index"]
    with pytest.raises(INVALID):  # no seq
        QueueEnter.validate(pd.DataFrame({"sim_time_us": [0], "item_id": [1], "queue_id": [2], "index": [0]}))


def test_seq_is_unique_within_a_table() -> None:
    with pytest.raises(INVALID):
        StationEnd.validate(pd.DataFrame({"seq": [3, 3], "sim_time_us": [0, 0], "job_id": [1, 2]}))


def test_jobs_start_once_and_may_have_an_unknown_duration() -> None:
    start = pd.DataFrame(
        {
            "seq": [0, 1],
            "sim_time_us": [0, 0],
            "job_id": [1, 2],
            "item_id": [7, 8],
            "station_id": [10, 11],
            "expected_duration_us": [5_000_000, UNKNOWN],
        }
    )
    StationStart.validate(start)
    with pytest.raises(INVALID):
        StationStart.validate(start.assign(job_id=[1, 1]))
    with pytest.raises(INVALID):
        StationStart.validate(start.assign(expected_duration_us=[-2, 0]))


def test_consumption_counts_each_sku_once_per_job_and_at_least_one() -> None:
    rows = pd.DataFrame(
        {"seq": [1, 2], "sim_time_us": [0, 0], "job_id": [1, 1], "inventory_id": [5, 5], "sku_id": [100, 200], "count": [2, 1]}
    )
    Consumption.validate(rows)
    with pytest.raises(INVALID):
        Consumption.validate(rows.assign(sku_id=[100, 100]))
    with pytest.raises(INVALID):
        Consumption.validate(rows.assign(count=[0, 1]))


def test_meta_is_one_row_of_the_current_version() -> None:
    meta = pd.DataFrame({"format_version": [FORMAT_VERSION], "start_unix_us": [0], "end_sim_time_us": [10]})
    Meta.validate(meta)
    with pytest.raises(INVALID):
        Meta.validate(pd.concat([meta, meta]))
    with pytest.raises(INVALID):
        Meta.validate(meta.assign(format_version=FORMAT_VERSION + 1))


def test_seq_is_unique_across_tables() -> None:
    assert duplicate_seqs(pd.DataFrame({"seq": [0, 1]}), pd.DataFrame({"seq": [1, 2]})) == [1]
