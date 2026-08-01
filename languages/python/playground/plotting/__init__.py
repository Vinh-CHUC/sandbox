from collections.abc import Iterable
from typing import Any, assert_never

import altair as alt
import numpy as np
import numpy.typing as npt
import pandas as pd


def _find(names: Iterable[str], targets: tuple[str, ...]) -> str | None:
    lowered = {t.lower() for t in targets}
    return next((n for n in names if n.lower() in lowered), None)


def _to_dataframe(data: pd.DataFrame | npt.NDArray | list[npt.NDArray]) -> pd.DataFrame:
    match data:
        case list() as l:
            return _to_dataframe(np.column_stack(l)) 
        case pd.DataFrame() as df:
            return df
        case np.ndarray():
            arr = data
            match arr.ndim:
                case 1:
                    return pd.DataFrame({"x": np.arange(len(arr)), "y": arr})
                case 2 if arr.shape[1] >= 2:
                    cols = {f"c_{i}": arr[:, i] for i in range(arr.shape[1])}
                    return pd.DataFrame(cols)
                case 2 if arr.shape[1] == 1:
                    return pd.DataFrame({"x": np.arange(len(arr)), "y": arr[:, 0]})
                case ndim if ndim > 2:
                    raise ValueError(f"unsupported ndarray shape {arr.shape}")
                case _:
                    raise ValueError(f"unsupported ndarray shape {arr.shape}")
        case _:
            assert_never(data)


def twod(
    data: pd.DataFrame | np.ndarray | list[np.ndarray],
    *,
    mark: str = "point",
    x: str | None = None,
    y: str | None = None,
    **encodings: Any,
) -> alt.Chart:
    """Build a chart from ``data`` with sensible x/y defaults.

    ``data`` may be a ``pandas.DataFrame`` or a ``numpy.ndarray``:

      - 1D array  -> x = index (0..n-1), y = values
      - 2D array  -> x = column 0, y = column 1 (extra columns kept as ``c2..``)

    Channel resolution order for each axis:
      1. the explicitly passed ``x``/``y`` argument
      2. a column whose name is ``"x"`` / ``"y"`` (case-insensitive)
      3. the first (for x) and second (for y) column of the frame

    ``encodings`` are forwarded to ``Chart.encode`` (e.g. ``color="c"``).
    """
    df = _to_dataframe(data)
    cols = list(df.columns)
    x = x or _find(cols, ("x",))
    y = y or _find(cols, ("y",))

    if x is None:
        if len(cols) < 1:
            raise ValueError(f"need at least one column for x, got {len(cols)}")
        x = cols[0]
    if y is None:
        if len(cols) < 2:
            raise ValueError(f"need at least two columns for y, got {len(cols)}")
        y = cols[1]

    mark_fn = getattr(alt.Chart(df), f"mark_{mark}")
    return mark_fn().encode(x=x, y=y, **encodings)
