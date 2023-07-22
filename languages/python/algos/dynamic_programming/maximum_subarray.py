from math import inf
from typing import List


class SolutionN2:
    def maxSubArray(self, nums: List[int]) -> int:
        max_sub_array = -inf

        for i in range(len(nums)):
            current_line = nums[i]
            max_sub_array = max(max_sub_array, current_line)

            for j in range(i + 1, len(nums)):
                current_line += nums[j]
                max_sub_array = max(max_sub_array, current_line)

        return max_sub_array


Solution = SolutionN2


assert Solution().maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6
assert Solution().maxSubArray([1]) == 1
assert Solution().maxSubArray([5, 4, -1, 7, 8]) == 23


class SolutionN:
    def maxSubArray(self, nums: List[int]) -> int:
        max_sub_array = -inf

        DP: List[int] = []

        for idx, n in enumerate(nums):
            if idx == 0:
                DP.append(n)
            else:
                DP.append(max(DP[idx-1] + n, n))
            max_sub_array = max(max_sub_array, DP[idx])

        return max_sub_array


Solution = SolutionN


assert Solution().maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6
assert Solution().maxSubArray([1]) == 1
assert Solution().maxSubArray([5, 4, -1, 7, 8]) == 23


class SolutionN_B:
    def maxSubArray(self, nums: List[int]) -> int:
        max_sub_array = -inf

        DP: List[int] = []

        for idx, n in enumerate(nums):
            if idx == 0:
                DP.append(n)
            else:
                if DP[idx-1] < 0:
                    DP.append(n)
                else:
                    DP.append(DP[idx-1] + n)
            max_sub_array = max(max_sub_array, DP[idx])

        return max_sub_array


Solution = SolutionN_B


assert Solution().maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6
assert Solution().maxSubArray([1]) == 1
assert Solution().maxSubArray([5, 4, -1, 7, 8]) == 23


class SolutionN_C:
    def maxSubArray(self, nums: List[int]) -> int:
        max_sub_array = -inf
        max_sub_array_idx = -inf

        for n in nums:
            max_sub_array_idx = max(max_sub_array_idx + n, n)
            max_sub_array = max(max_sub_array_idx, max_sub_array)

        return max_sub_array


Solution = SolutionN_C


assert Solution().maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6
assert Solution().maxSubArray([1]) == 1
assert Solution().maxSubArray([5, 4, -1, 7, 8]) == 23
