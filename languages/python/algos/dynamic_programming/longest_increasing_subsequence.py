from dataclasses import dataclass
from typing import List


@dataclass
class DPInfo:
    longest_length: int
    last_element_val: int


class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        lis_finishing_at: List[DPInfo] = []
        longest = 0

        for idx, num in enumerate(nums):
            lis_to_append_to = max(
               (x for x in reversed(lis_finishing_at[:idx]) if x.last_element_val < num),
               default=None,
               key=lambda x: x.longest_length
            )
            match lis_to_append_to:
                # First element in list
                case None:
                    lis_finishing_at.append(DPInfo(longest_length=1, last_element_val=num))
                case DPInfo(longest_length=longest_length):
                    lis_finishing_at.append(
                        DPInfo(longest_length=longest_length+1, last_element_val=num)
                    )
            longest = max(longest, lis_finishing_at[-1].longest_length)

        return longest


assert Solution().lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18]) == 4
assert Solution().lengthOfLIS([0, 1, 0, 3, 2, 3]) == 4
assert Solution().lengthOfLIS([7, 7, 7, 7, 7, 7, 7]) == 1
