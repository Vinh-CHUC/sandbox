from pathlib import Path

import dagster as dg


DAGSTER_DEFAULT_OUTPUT_FOLDER = Path(__file__).parent.parent.parent.parent / "jobs_output"

my_job = dg.define_asset_job(
    name="my_job",
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
                "config": {"count": 10_000}
            }
        }
    }
)
