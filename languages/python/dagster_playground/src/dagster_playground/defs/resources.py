from functools import cache
from pathlib import Path
import dagster as dg
import pandas as pd


@cache
def mkdir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def _get_path(
    context: dg.OutputContext | dg.InputContext,
    base_path: str,
    file_ext: str
) -> Path:
    mkdir(Path(base_path))
    p = Path(base_path) / Path(*context.asset_key.path)
    partition_suffix = (
        context.has_partition_key and ("_part" + (context.partition_key or ""))
    ) or ""
    return Path(f"{p}{partition_suffix}.{file_ext}")


class PandasCSVIOManager(dg.ConfigurableIOManager):
    base_path: str = ""

    def handle_output(self, context: dg.OutputContext, obj: pd.DataFrame):
        p = _get_path(context, self.base_path, "csv")
        obj.to_csv(p, index=False)

    def load_input(self, context: dg.InputContext):
        return pd.read_csv(_get_path(context, self.base_path, "csv"))

class PandasParquetIOManager(dg.ConfigurableIOManager):
    base_path: str = ""

    def handle_output(self, context: dg.OutputContext, obj: pd.DataFrame):
        obj.to_parquet(_get_path(context, self.base_path, "parquet"), index=False)

    def load_input(self, context: dg.InputContext):
        p = _get_path(context, self.base_path, "parquet")
        return pd.read_parquet(p)

DAGSTER_DEFAULT_OUTPUT_FOLDER = Path(__file__).parent.parent.parent.parent / "assets_output"

defs = dg.Definitions(
    resources={
        "csv_io_manager": PandasCSVIOManager(base_path=str(DAGSTER_DEFAULT_OUTPUT_FOLDER)),
        "parquet_io_manager": PandasParquetIOManager(base_path=str(DAGSTER_DEFAULT_OUTPUT_FOLDER)),
    }
)
