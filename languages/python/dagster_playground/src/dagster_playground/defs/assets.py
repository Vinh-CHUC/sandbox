import os
import numpy as np
import pandas as pd

import dagster as dg

from dagster_playground.defs.config import DataGenConfig

"""
Only one configuration object per asset that has to be named config
"""

RNG = np.random.default_rng(seed=0)
id_partitions = dg.StaticPartitionsDefinition([str(i) for i in range(10)])


@dg.asset(io_manager_key="parquet_io_manager")
def processed_data(config: DataGenConfig):
    df = pd.DataFrame(
        {
            "some_id": RNG.choice(100, size=config.count),
            "dummy_int": np.arange(config.count),
            "dummy_str": [f"Hello {x}" for x in np.arange(config.count)],
        }
    )

    return df


@dg.op(out=dg.DynamicOut(io_manager_key="parquet_io_manager"))
def splitter(df: pd.DataFrame):
    chunk_size = 300
    number_of_parts = len(df.index) // chunk_size
    df_chunks = np.array_split(df, number_of_parts)
    for idx, c in enumerate(df_chunks):
        yield dg.DynamicOutput(c, mapping_key=str(idx))


@dg.op(out=dg.Out(io_manager_key="parquet_io_manager"))
def process_chunk(context: dg.AssetExecutionContext, df: pd.DataFrame) -> pd.DataFrame:
    context.log.info(f"PID: {os.getpid()}")
    df = df.assign(another_dummy_str=df.dummy_str + "yoo")
    return df


@dg.op(out=dg.Out(io_manager_key="csv_io_manager"))
def concat_chunks(chunks: list[pd.DataFrame]) -> pd.DataFrame:
    return pd.concat(chunks, ignore_index=True)


"""
It seems that the io_manager assigned to the graph_asset is that of the op that it returns
"""


@dg.graph_asset
def write_to_csv(processed_data: pd.DataFrame):
    return concat_chunks(splitter(processed_data).map(process_chunk).collect())
