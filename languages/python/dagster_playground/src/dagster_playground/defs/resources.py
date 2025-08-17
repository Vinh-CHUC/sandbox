from functools import cache
from pathlib import Path
import dagster as dg
import pandas as pd


@cache
def mkdir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


class PandasCSVIOManager(dg.ConfigurableIOManager):
    base_path: str = ""

    def _get_path(self, context) -> Path:
        mkdir(Path(self.base_path))
        p = Path(self.base_path) / Path(*context.asset_key.path)
        return Path(f"{p}.csv")

    def handle_output(self, context: dg.OutputContext, obj: pd.DataFrame):
        obj.to_csv(self._get_path(context), index=False)

    def load_input(self, context: dg.InputContext):
        return pd.read_csv(self._get_path(context))

class PandasParquetIOManager(dg.ConfigurableIOManager):
    base_path: str = ""

    def _get_path(self, context) -> Path:
        mkdir(Path(self.base_path))
        p = Path(self.base_path) / Path(*context.asset_key.path)
        return Path(f"{p}.parquet")

    def handle_output(self, context: dg.OutputContext, obj: pd.DataFrame):
        obj.to_parquet(self._get_path(context), index=False)

    def load_input(self, context: dg.InputContext):
        return pd.read_parquet(self._get_path(context))

DAGSTER_DEFAULT_OUTPUT_FOLDER = Path(__file__).parent.parent.parent.parent / "assets_output"

defs = dg.Definitions(
    resources={
        "csv_io_manager": PandasCSVIOManager(base_path=str(DAGSTER_DEFAULT_OUTPUT_FOLDER)),
        "parquet_io_manager": PandasParquetIOManager(base_path=str(DAGSTER_DEFAULT_OUTPUT_FOLDER)),
    }
)
