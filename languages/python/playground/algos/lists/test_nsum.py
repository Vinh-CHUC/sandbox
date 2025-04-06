import pytest

from algos.lists import nsum


class TestTwoSum:
    @pytest.mark.parametrize(
        "arr,target,expected",
        [
            ([2, 7, 11, 15], 9, [0, 1]),
            ([3, 2, 4], 6, [1, 2]),
            ([3, 3], 6, [0, 1]),
        ]
    )
    def test_basic(self, arr, target ,expected):
        assert nsum.twoSum(arr, target) == expected

    @pytest.mark.parametrize(
        "arr,target,expected",
        [
            ([2, 7, 11, 15], 9, [0, 1]),
            ([3, 2, 4], 6, [1, 2]),
            ([3, 3], 6, [0, 1]),
        ]
    )
    def test_noloop(self, arr, target ,expected):
        assert nsum.twoSum_no_loops(arr, target) == expected
