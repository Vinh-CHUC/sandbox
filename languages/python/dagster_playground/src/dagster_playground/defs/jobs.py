from pathlib import Path

import dagster as dg


DAGSTER_DEFAULT_OUTPUT_FOLDER = (
        Path(__file__).parent.parent.parent.parent / "jobs_output"
        )

IO_MANAGERS = {
    "csv_io_manager": {
        "config": {
            "base_path": str(DAGSTER_DEFAULT_OUTPUT_FOLDER),
            }
        },
    "parquet_io_manager": {
        "config": {
            "base_path": str(DAGSTER_DEFAULT_OUTPUT_FOLDER),
            }
        },
}

jobA = dg.define_asset_job(
        name="jobA",
    selection=dg.AssetSelection.keys("assetA").upstream(),
    config={
        "resources": IO_MANAGERS,
        "ops": {"processed_data": {"config": {"count": 1_000}}},
    },
    executor_def=dg.in_process_executor
)

jobB = dg.define_asset_job(
    name="jobB",
    selection=dg.AssetSelection.keys("assetB").upstream(),
    config={
        "resources": IO_MANAGERS,
        "ops": {"processed_data": {"config": {"count": 1_000}}},
    },
    executor_def=dg.in_process_executor
)
