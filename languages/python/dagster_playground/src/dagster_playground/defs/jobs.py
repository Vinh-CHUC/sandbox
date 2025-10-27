from pathlib import Path

import dagster as dg


DAGSTER_DEFAULT_OUTPUT_FOLDER = (
    Path(__file__).parent.parent.parent.parent / "jobs_output"
)


def build_io_manager_config(io_manager_base_path: Path) -> dict:
    return {
        "csv_io_manager": {
            "config": {
                "base_path": str(io_manager_base_path),
            }
        },
        "parquet_io_manager": {
            "config": {
                "base_path": str(io_manager_base_path),
            }
        },
        "csv_and_parquet_io_manager": {
            "config": {
                "base_path": str(io_manager_base_path),
            }
        },
    }


def job_builder(
    job_name: str, asset_name: str, io_manager_base_path: Path, row_count: int
):
    return dg.define_asset_job(
        name=job_name,
        selection=dg.AssetSelection.keys(asset_name).upstream(),
        config={
            "resources": build_io_manager_config(io_manager_base_path),
            "ops": {"processed_data": {"config": {"count": row_count}}},
        },
        executor_def=dg.in_process_executor,
    )


jobA = job_builder("jobA", "assetA", DAGSTER_DEFAULT_OUTPUT_FOLDER, 1_000)
jobB = job_builder("jobB", "assetB", DAGSTER_DEFAULT_OUTPUT_FOLDER, 1_000)
