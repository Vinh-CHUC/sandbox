/*
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
*/

#include <algorithm>
#include <unordered_map>
#include <vector>

#include <gtest/gtest.h>

using indices_pair_t = std::array<int, 2>;

indices_pair_t twoSum(const std::vector<int>& nums, int target){
  auto hash_m = std::unordered_map<int, int>{};

  for(size_t i = 0; i < nums.size(); i++){
    if (hash_m.find(target-nums[i]) != hash_m.end()){
      auto v = std::array<int, 2>{static_cast<int>(i), hash_m[target-nums[i]]};
      std::sort(v.begin(), v.end());
      return v;
    }
    hash_m[nums[i]] = i;
  }

  return {-1, -1};
}

class SumTestP : public ::testing::TestWithParam<std::tuple<std::vector<int>, int, indices_pair_t>> {
};

TEST_P(SumTestP, Basics){
  const auto& [nums, target, expected] = GetParam();
  auto actual = twoSum(nums, target);
  ASSERT_EQ(actual, expected);
};

INSTANTIATE_TEST_SUITE_P(
    SumTest,
    SumTestP,
    ::testing::Values(
        std::make_tuple(
          std::vector{2, 7, 11, 15},
          9,
          indices_pair_t{0, 1}
        ),
        std::make_tuple(
          std::vector{3, 2, 4},
          6,
          indices_pair_t{1, 2}
        ),
        std::make_tuple(
          std::vector{3, 3},
          6,
          indices_pair_t{0, 1}
        )
    )
);
