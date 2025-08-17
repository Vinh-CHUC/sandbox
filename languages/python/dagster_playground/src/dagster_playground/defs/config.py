import dagster as dg


class DataGenConfig(dg.Config):
    count: int = 100


"""
Not necessary?
"""
# defs = dg.Definitions(resources={"configs": DataGenConfig(count=10000)})
