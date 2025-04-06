from dataclasses import dataclass
from typing import List


class SolutionBruteForce:
    def lengthOfLIS(self, nums: List[int]) -> int:
        def get_subsequences(idx: int, nums: List[int]) -> List[List[int]]:
            if idx == len(nums) - 1:
                return [[nums[-1]], []]
            return [
                [nums[idx]] + s for s in get_subsequences(idx + 1, nums)
            ] + get_subsequences(idx + 1, nums)

        subsequences: List[List[int]] = get_subsequences(0, nums)

        increasing_subsequences = [
            ss for ss in subsequences if sorted(ss) == ss and len(set(ss)) == len(ss)
        ]

        return max((len(ss) for ss in increasing_subsequences))


Solution = SolutionBruteForce

assert Solution().lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18]) == 4
assert Solution().lengthOfLIS([0, 1, 0, 3, 2, 3]) == 4
assert Solution().lengthOfLIS([7, 7, 7, 7, 7, 7, 7]) == 1
assert Solution().lengthOfLIS([1, 3, 6, 7, 9, 4, 10, 5, 6]) == 6


@dataclass
class DPInfo:
    longest_length: int
    last_element_val: int


"""
Philosophical point: we necessarily depend on the results for *all* entries in dp_array
The nature of the problem (increasing) makes it so, solution(i) does not depend on only
solution(i-1)
e.g.
              *
-10, 1, 2, 3, -9, -8, -7, -6, -5

We have to go back all the way to -10
"""


class SolutionDP:
    def lengthOfLIS(self, nums: List[int]) -> int:
        longest = 0
        dp_array: List[DPInfo] = []

        for n in nums:
            prev_compatible_ss = [dp for dp in dp_array if dp.last_element_val < n]
            if prev_compatible_ss:
                prev_ss = max(prev_compatible_ss, key=lambda x: x.longest_length)
                dp_array.append(
                    DPInfo(
                        longest_length=prev_ss.longest_length + 1, last_element_val=n
                    )
                )
            else:
                dp_array.append(DPInfo(1, n))

            longest = max(longest, dp_array[-1].longest_length)

        return longest


Solution = SolutionDP


assert Solution().lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18]) == 4
assert Solution().lengthOfLIS([0, 1, 0, 3, 2, 3]) == 4
assert Solution().lengthOfLIS([7, 7, 7, 7, 7, 7, 7]) == 1
assert Solution().lengthOfLIS([1, 3, 6, 7, 9, 4, 10, 5, 6]) == 6
