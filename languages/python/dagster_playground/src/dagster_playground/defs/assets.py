import numpy as np
import pandas as pd

import dagster as dg

from dagster_playground.defs.config import DataGenConfig

"""
Only one configuration object per asset that has to be named config
"""

RNG = np.random.default_rng(seed=0)
id_partitions = dg.DynamicPartitionsDefinition(name="id_partitions")

@dg.asset(io_manager_key="parquet_io_manager")
def processed_data(
    context: dg.AssetExecutionContext,
    config: DataGenConfig
):
    df = pd.DataFrame(
        {
            "some_id": RNG.choice(100, size=config.count),
            "dummy_int": np.arange(config.count),
            "dummy_str": [f"Hello {x}" for x in np.arange(config.count)],
        }
    )

    context.instance.add_dynamic_partitions("id_partitions", [str(i) for i in range(10)])

    return df

@dg.asset(io_manager_key="csv_io_manager")
def write_to_csv(processed_data: pd.DataFrame):
    return processed_data
