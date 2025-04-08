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


"""
There is a flaw in all of these currently:
    - the hashmap should containe a list of pairs, otherwise a more recent update might not be
      usable as it conflicts (same idx_i or idx-j) as the target idx
    - overlap management: it's really down to the fact that you can't quite walk the space 
    and guaranteeing that the entries in the hashmap are valid candidates based on the value only
"""
def threeSum_two_idxs_in_hashmap(nums: List[int]) -> List[List[int]]:
    """
    In the hashmap keep **two indices**,two passes:
        1. build the hashmap
        2. find the indices
    """
    hash_m: dict[int, tuple[int, int]] = {}

    ret = []

    for idx_i, val_i in enumerate(nums):
        for idx_j, val_j in zip(range(idx_i + 1, len(nums)), nums[idx_i + 1 :]):
            hash_m[(val_i + val_j)] = (idx_i, idx_j)

    for idx_i, val_i in enumerate(nums):
        if (-val_i in hash_m) and (idx_i not in hash_m[-val_i]):
            ret.append(
                tuple(sorted([nums[hash_m[-val_i][0]], nums[hash_m[-val_i][1]], val_i]))
            )

    return sorted(set(ret))


def threeSum_two_idxs_in_hashmap_one_pass(nums: List[int]) -> List[List[int]]:
    """
    A bit simpler than the variant above also as we don't store the indices but the values directly
    """
    hash_m: dict[int, tuple[int, int]] = {}

    ret = []

    for idx_i, val_i in enumerate(nums):
        # Doing the check at the beginning of the loop guarantees no duplicate indices
        if -val_i in hash_m:
            ret.append(
                tuple(sorted([*hash_m[-val_i], val_i]))
            )

        for val_j in nums[idx_i + 1 :]:
            hash_m[(val_i + val_j)] = (val_i, val_j)

    return sorted(set(ret))

def threeSum_two_idxs_in_hashmap_one_pass_2(nums: List[int]) -> List[List[int]]:
    """
    A bit simpler than the variant above also as we don't store the indices but the values directly
    """
    hash_m: dict[int, tuple[int, int]] = {}

    ret = []

    for idx_i, val_i in enumerate(nums):
        if -val_i in hash_m and idx_i not in hash_m[-val_i]:
            ret.append(
                tuple(sorted([nums[hash_m[-val_i][0]], nums[hash_m[-val_i][1]], val_i]))
            )
        for idx_j, val_j in zip(range(idx_i+1, len(nums)), nums[idx_i + 1 :]):
            hash_m[(val_i + val_j)] = (idx_i, idx_j)

    return sorted(set(ret))
