import shutil
import subprocess
from pathlib import Path

def test_run_my_job_and_check_files():
    # Define the output directory
    output_dir = Path(__file__).parent.parent / "jobs_output"
    shutil.rmtree(output_dir)

    subprocess.run(["dg", "launch", "--job", "my_job"], check=True)

    # Define the expected files, similar to the justfile
    expected_files = [
        "processed_data.parquet",
        *[f"write_to_csv.splitter[{i}].parquet" for i in range(3)],
        *[f"write_to_csv.process_chunk[{i}].parquet" for i in range(3)],
        "write_to_csv.csv"
    ]

    # Check for the presence of each expected file
    missing_files = []
    for p in expected_files:
        full_path = output_dir / p
        if not full_path.exists():
            missing_files.append(str(full_path))

    assert not missing_files, f"The following expected files were not found: {', '.join(missing_files)}"
