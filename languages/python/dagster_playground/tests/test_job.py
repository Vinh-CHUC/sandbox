import shutil
import subprocess
from pathlib import Path

from dagster_playground.defs.jobs import DAGSTER_DEFAULT_OUTPUT_FOLDER


def test_jobA():
    # Define the output directory
    shutil.rmtree(DAGSTER_DEFAULT_OUTPUT_FOLDER, ignore_errors=True)

    subprocess.run(["dg", "launch", "--job", "jobA"], check=True)

    # Define the expected files, similar to the justfile
    expected_files = [
        "processed_data.parquet",
        *[f"assetA.splitter[{i}].parquet" for i in range(3)],
        *[f"assetA.process_chunk[{i}].parquet" for i in range(3)],
        "assetA.csv",
    ]

    # Check for the presence of each expected file
    missing_files = []
    for p in expected_files:
        full_path = DAGSTER_DEFAULT_OUTPUT_FOLDER / p
        if not full_path.exists():
            missing_files.append(str(full_path))

    assert not missing_files, (
        f"The following expected files were not found: {', '.join(missing_files)}"
    )


def test_jobB():
    # Define the output directory
    shutil.rmtree(DAGSTER_DEFAULT_OUTPUT_FOLDER, ignore_errors=True)

    subprocess.run(["dg", "launch", "--job", "jobB"], check=True)

    # Define the expected files, similar to the justfile
    expected_files = [
        "processed_data.parquet",
        *[f"assetB.splitter[{i}].parquet" for i in range(3)],
        *[f"assetB.save_chunk_to_csv[{i}].csv" for i in range(3)],
        "assetB.csv",
    ]

    # Check for the presence of each expected file
    missing_files = []
    for p in expected_files:
        full_path = DAGSTER_DEFAULT_OUTPUT_FOLDER / p
        if not full_path.exists():
            missing_files.append(str(full_path))

    assert not missing_files, (
        f"The following expected files were not found: {', '.join(missing_files)}"
    )
