from functools import cache, cached_property
from pathlib import Path
import dagster as dg
import pandas as pd


@cache
def mkdir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def _op_output_name(step_key: str, mapping_key: str | None) -> str:
    return f"{step_key}[{mapping_key}]" if mapping_key else step_key


def _get_path(
    context: dg.OutputContext | dg.InputContext, base_path_str: str, file_ext: str
) -> Path:
    """Derive a deterministic file path for an output/input.

    Three context fields drive the naming; they answer different questions
    (example values taken from jobA/jobB/jobC):

    - `asset_key` -- WHICH LOGICAL ASSET is this? Set only when the value being
      stored/loaded *is* an asset: "processed_data", "assetA" (the value
      returned by the graph_asset, i.e. concat_chunks' output),
      "partitioned_data" (jobC). Intermediate op outputs inside a graph_asset
      (splitter, process_chunk, save_chunk_to_csv) have NO asset key.

    - `step_key` -- WHICH EXECUTION STEP produced it? Always set on an
      OutputContext. "processed_data" for a plain asset;
      "assetA.splitter" for an op nested in a graph_asset; and for a step
      cloned by .map() over a DynamicOut, the clone's index is already baked
      in: "assetA.process_chunk[0]".

    - `mapping_key` -- WHICH DYNAMIC BRANCH is this output? Set only on
      outputs yielded through DynamicOut, e.g. "0" for
      `DynamicOutput(c, mapping_key="0")` from assetA.splitter. Note the
      asymmetry with the mapped steps downstream: process_chunk[0]'s output
      has mapping_key=None -- its branch index lives in step_key instead,
      because the whole *step* is a per-branch clone, whereas splitter is a
      single step emitting several branched *outputs*.
    """
    base_path = Path(base_path_str)
    mkdir(base_path)

    # jobC, partition "3" -> "_part3"; jobA/jobB are unpartitioned -> ""
    partition_suffix = (
        ("_part" + (context.partition_key or "")) if context.has_partition_key else ""
    )

    if context.has_asset_key:
        p = base_path / Path(*context.asset_key.path)
    else:
        out = (
            context
            if isinstance(context, dg.OutputContext)
            else context.upstream_output
        )
        assert out is not None
        p = base_path / _op_output_name(out.step_key, out.mapping_key)

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


class TeeIOManager(dg.ConfigurableIOManager):
    base_path: str = ""

    @cached_property
    def csv(self):
        return PandasCSVIOManager(base_path=self.base_path)

    @cached_property
    def parquet(self):
        return PandasParquetIOManager(base_path=self.base_path)

    def handle_output(self, context: dg.OutputContext, obj: pd.DataFrame):
        self.csv.handle_output(context, obj)
        self.parquet.handle_output(context, obj)

    def load_input(self, context: dg.InputContext):
        return self.parquet.load_input(context)


DAGSTER_DEFAULT_OUTPUT_FOLDER = (
    Path(__file__).parent.parent.parent.parent / "assets_output"
)

defs = dg.Definitions(
    resources={
        "csv_io_manager": PandasCSVIOManager(
            base_path=str(DAGSTER_DEFAULT_OUTPUT_FOLDER)
        ),
        "parquet_io_manager": PandasParquetIOManager(
            base_path=str(DAGSTER_DEFAULT_OUTPUT_FOLDER)
        ),
        "csv_and_parquet_io_manager": TeeIOManager(
            base_path=str(DAGSTER_DEFAULT_OUTPUT_FOLDER)
        ),
    }
)
