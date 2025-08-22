from pathlib import Path

import dagster as dg


DAGSTER_DEFAULT_OUTPUT_FOLDER = Path(__file__).parent.parent.parent.parent / "jobs_output"

my_job = dg.define_asset_job(
    name="my_job",
    selection=dg.AssetSelection.keys("write_to_csv").upstream(),
    config={
        "resources": {
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
        },
        "ops": {
            "processed_data": {
                "config": {"count": 1_000}
            }
        }
    }
    # executor_def=dg.in_process_executor
)
