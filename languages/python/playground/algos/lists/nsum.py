from typing import List, Optional


def twoSum(nums: List[int], target: int) -> List[int]:
    hash_m = {}
    for idx, val in enumerate(nums):
        if (target - val) in hash_m:
            return sorted([hash_m[target - val], idx])
        # To enforce two different idxs do it here rather
        # than at the beginningi of the loop
        hash_m[val] = idx

    return [-1, -1]


def twoSum_no_loops(nums: List[int], target: int) -> List[int]:
    hash_m = {}

    def loop(idx, stop_idx) -> Optional[list[int]]:
        if idx == stop_idx:
            return None
        val = nums[idx]

        if (target - val) in hash_m:
            return sorted([hash_m[target - val], idx])

        hash_m[val] = idx
        return loop(idx + 1, stop_idx)

    return loop(0, len(nums)) or [-1, -1]


def threeSum(nums: List[int]) -> List[List[int]]:
    hash_m: dict[int, int] = {}

    ret = []

    for idx_i, val_i in enumerate(nums):
        for val_j in nums[idx_i + 1 :]:
            if (-val_i - val_j) in hash_m:
                ret.append(tuple(sorted([-val_i - val_j, val_i, val_j])))

        hash_m[val_i] = idx_i

    return sorted(set(ret))
