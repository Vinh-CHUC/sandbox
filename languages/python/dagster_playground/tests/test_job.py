"""
Migrate to run request? Have each job take a temp folder?
"""

import json
import shutil
import subprocess

import pandas as pd

from dagster_playground.defs.jobs import (
    DAGSTER_DEFAULT_OUTPUT_FOLDER,
    build_io_manager_config,
)


def _assert_files_exist(expected_files: list[str]):
    missing_files = [
        str(DAGSTER_DEFAULT_OUTPUT_FOLDER / p)
        for p in expected_files
        if not (DAGSTER_DEFAULT_OUTPUT_FOLDER / p).exists()
    ]
    assert not missing_files, (
        f"The following expected files were not found: {', '.join(missing_files)}"
    )


def test_jobA():
    shutil.rmtree(DAGSTER_DEFAULT_OUTPUT_FOLDER, ignore_errors=True)

    subprocess.run(["dg", "launch", "--job", "jobA"], check=True)

    _assert_files_exist(
        [
            "processed_data.parquet",
            *[f"assetA.splitter[{i}].parquet" for i in range(3)],
            *[f"assetA.process_chunk[{i}].parquet" for i in range(3)],
            "assetA.csv",
            "assetA.parquet",
        ]
    )

    # The concatenated result must contain every row of every chunk: this
    # fails if load_input resolved a wrong (but existing) file somewhere in
    # the splitter -> process_chunk -> concat_chunks chain.
    df = pd.read_parquet(DAGSTER_DEFAULT_OUTPUT_FOLDER / "assetA.parquet")
    assert len(df) == 1_000
    assert "another_dummy_str" in df.columns


def test_jobB():
    shutil.rmtree(DAGSTER_DEFAULT_OUTPUT_FOLDER, ignore_errors=True)

    subprocess.run(["dg", "launch", "--job", "jobB"], check=True)

    _assert_files_exist(
        [
            "processed_data.parquet",
            *[f"assetB.splitter[{i}].parquet" for i in range(3)],
            *[f"assetB.save_chunk_to_csv[{i}].csv" for i in range(3)],
            "assetB.csv",
        ]
    )

    df = pd.read_csv(DAGSTER_DEFAULT_OUTPUT_FOLDER / "assetB.csv")
    assert len(df) == 1_000


def test_jobC():
    """Exercises the partition_suffix branch of _get_path, on both the output
    side (partitioned_data, partitioned_doubled) and the input side
    (partitioned_doubled loading partitioned_data for the same partition).
    """
    shutil.rmtree(DAGSTER_DEFAULT_OUTPUT_FOLDER, ignore_errors=True)

    # Config must be passed explicitly: a partitioned job's `config=` dict is
    # wrapped into a PartitionedConfig, which `dg launch` does not consult.
    run_config = {
        "resources": build_io_manager_config(DAGSTER_DEFAULT_OUTPUT_FOLDER),
        "ops": {"partitioned_data": {"config": {"count": 1_000}}},
    }
    subprocess.run(
        [
            "dg",
            "launch",
            "--job",
            "jobC",
            "--partition",
            "3",
            "--config-json",
            json.dumps(run_config),
        ],
        check=True,
    )

    _assert_files_exist(
        [
            "partitioned_data_part3.parquet",
            "partitioned_doubled_part3.csv",
        ]
    )

    df = pd.read_csv(DAGSTER_DEFAULT_OUTPUT_FOLDER / "partitioned_doubled_part3.csv")
    assert len(df) == 1_000
    # some_id is the partition id: proves the input load picked up partition 3
    assert (df.some_id == 3).all()
    upstream = pd.read_parquet(
        DAGSTER_DEFAULT_OUTPUT_FOLDER / "partitioned_data_part3.parquet"
    )
    assert (df.dummy_int == upstream.dummy_int * 2).all()
