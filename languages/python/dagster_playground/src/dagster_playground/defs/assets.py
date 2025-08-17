import numpy as np
import pandas as pd

import dagster as dg

from dagster_playground.defs.config import DataGenConfig

"""
Only one configuration object per asset that has to be named config
"""

@dg.asset(io_manager_key="parquet_io_manager")
def processed_data(config: DataGenConfig):
    df = pd.DataFrame(
        {
            "dummy_int": np.arange(config.count),
            "dummy_str": [f"Hello {x}" for x in np.arange(config.count)],
        }
    )

    return df

@dg.asset(io_manager_key="csv_io_manager")
def write_to_csv(processed_data: pd.DataFrame):
    return processed_data
