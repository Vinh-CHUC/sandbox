import pandera.pandas as pa


class Table(pa.DataFrameModel):
    """Shared by every trace table: exactly the declared columns, coerced to their types"""

    class Config:  # pyright: ignore[reportIncompatibleVariableOverride]
        strict = True  # no columns beyond the declared ones
        coerce = True  # e.g. parquet int64 → uint32 on read
