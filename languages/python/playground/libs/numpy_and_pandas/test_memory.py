import pytest

import numpy as np
import numpy.testing as nptest
import pandas as pd

class TestDataFrameCopy:
    def test_2d_array(self):
        """
        Passing a 2D nd-array behaves like a copy=False by default so one has to force 
        copy=True
        """
        arr = np.zeros((10, 5))

        df = pd.DataFrame(
            arr, columns=[f"col_{i}" for i in range(5)], copy=True
        )
        # Using .iloc or .loc for in-place modification
        df.iloc[:, 3] = 10

        with pytest.raises(AssertionError):
            nptest.assert_array_equal(df["col_3"].to_numpy(), arr[:, 3])

    def test_dict_of_columns(self):
        """
        Passing a dict of columns behaves like a copy by default,
        so one has to force copy=False
        """
        arr = np.zeros((10, 5))

        df = pd.DataFrame({f"col_{i}": arr[:, i] for i in range(5)})
        # Using .iloc or .loc for in-place modification
        df.iloc[:, 3] = 10

        with pytest.raises(AssertionError):
            nptest.assert_array_equal(df["col_3"].to_numpy(), arr[:, 3])

class TestDataFrameView:
    def test_2d_array(self):
        """
        Passing a 2D nd-array behaves like a copy=False by default
        """
        arr = np.zeros((10, 5))

        df = pd.DataFrame(arr, columns=[f"col_{i}" for i in range(5)])
        # Using .iloc or .loc for in-place modification
        df.iloc[:, 3] = 10

        # This should pass if it is a view
        nptest.assert_array_equal(df["col_3"].to_numpy(), arr[:, 3])

    def test_dict_of_columns(self):
        """
        Passing a dict of columns behaves like a copy by default,
        so one has to force copy=False
        """
        arr = np.zeros((10, 5))

        df = pd.DataFrame({f"col_{i}": arr[:, i] for i in range(5)}, copy=False)
        # Using .iloc or .loc for in-place modification
        df.iloc[:, 3] = 10

        nptest.assert_array_equal(df["col_3"].to_numpy(), arr[:, 3])

    def test_dict_of_columns_structured_array(self):
        # Replace by a structured array with ["coords"]["x"] (y and z) also
        dtype = [("coords", [("x", "f8"), ("y", "f8"), ("z", "f8")])]
        arr = np.zeros(10, dtype=dtype)

        # Point at the ["coords"]["x"] columns instead
        df = pd.DataFrame(
            {"x": arr["coords"]["x"], "y": arr["coords"]["y"], "z": arr["coords"]["z"]},
            copy=False,
        )
        # Using .iloc or .loc for in-place modification
        df.loc[:, "x"] = 10  # Modify 'x'

        # This will likely fail for structured arrays even with copy=False
        # but following the pattern to verify behavior
        nptest.assert_array_equal(df["x"].to_numpy(), arr["coords"]["x"])

class TestViewBreak:
    def test_view_breaks_on_direct_assignment(self):
        """
        Assigning a new object to a column breaks the view because it replaces 
        the reference for that column.
        """
        arr = np.zeros((10, 3))
        df = pd.DataFrame(arr, columns=["a", "b", "c"], copy=False)

        # This is an in-place update (keeps view)
        df.iloc[:, 0] = 1

        # This replaces the column reference (breaks view)
        df["b"] = np.ones(10) * 5

        df["c"] = df["c"].astype("float64")
        df.loc[:, "c"] = 9.9

        # 'a' is still a view !!!
        nptest.assert_array_equal(df["a"].to_numpy(), arr[:, 0])

        # 'b' is NO LONGER a view
        with pytest.raises(AssertionError):
            nptest.assert_array_equal(df["b"].to_numpy(), arr[:, 1])

        # 'c' is NO LONGER a view
        with pytest.raises(AssertionError):
            nptest.assert_array_equal(df["c"].to_numpy(), arr[:, 2])

    def test_dataframe_assign(self):
        """
        df.assign() returns a NEW DataFrame. 
        Unmodified columns remain views, but the assigned column is new.
        """
        arr = np.zeros((10, 2))
        df = pd.DataFrame(arr, columns=["a", "b"], copy=False)

        df2 = df.assign(c=np.ones(10) * 3)
        df2.loc[:, "a"] = 1
        nptest.assert_array_equal(df["a"], arr[:, 0])

        df2.loc[:, "b"] = 2
        nptest.assert_array_equal(df["b"], arr[:, 1])
