from pathlib import Path
import dagster as dg
import pandas as pd


class PandasCSVIOManager(dg.ConfigurableIOManager):
    base_path: str = ""

    def _get_path(self, context) -> Path:
        return Path(self.path_prefix) / Path(*context.asset_key.path)

    def handle_output(self, context: dg.OutputContext, obj: pd.DataFrame):
        obj.to_csv(self._get_path(context), index=False)

    def load_input(self, context: dg.InputContext):
        return pd.read_csv(self._get_path(context))

class PandasParquetIOManager(dg.ConfigurableIOManager):
    base_path: str = ""

    def _get_path(self, context) -> Path:
        return Path(self.path_prefix) / Path(*context.asset_key.path)

    def handle_output(self, context: dg.OutputContext, obj: pd.DataFrame):
        obj.to_parquet(self._get_path(context), index=False)

    def load_input(self, context: dg.InputContext):
        return pd.read_parquet(self._get_path(context))

DAGSTER_OUTPUT_FOLDER = Path(__file__).parent.parent / "dagster_assets"
DAGSTER_OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

defs = dg.Definitions(
    resources={
        "csv_io_manager": PandasCSVIOManager(base_path=str(DAGSTER_OUTPUT_FOLDER)),
        "parquet_io_manager": PandasParquetIOManager(base_path=str(DAGSTER_OUTPUT_FOLDER)),
    }
)
