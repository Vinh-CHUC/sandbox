import numpy as np
import pandas as pd

import dagster as dg

@dg.asset
def processed_data():
    df = pd.DataFrame(
        {
            "dummy_int": np.arange(100000),
            "dummy_str": [f"Hello {x}" for x in np.arange(100000)],
        }
    )

    return df
