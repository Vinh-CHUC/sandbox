#include <gtest/gtest.h>
#include <algorithm>
#include <numeric>

TEST(Algos, Transforming){
  auto v = std::vector{1, 2, 3, 4, 5};

  std::transform(
      v.begin(), v.end(), v.begin(),
      [](const auto& n){
        return n + 2;
      });

  std::transform(
      v.begin(), v.end(), v.begin(),
      [](const auto& n){
        return n + 2;
      });


  auto out = std::vector<int>{};

  std::copy_if(
      v.begin(), v.end(), std::back_inserter(out),
      [](const auto& n){
        return n == 5;
      });

  ASSERT_EQ(v[0], 5);
  ASSERT_EQ(out.size(), 1);
}

TEST(Algos, DontForgetToAllocateDestination){
  auto v = std::vector<int>{1, 2, 3, 4, 5};
  auto result = std::vector<int>{};

  std::transform(
      v.begin(),
      v.end(),
      // result.begin(), this would segfault
      std::back_inserter(result),
      [](const auto& n){
        return n + 2;
      });

  ASSERT_EQ(result[0], 3);
}

TEST(Algos, ZippingTheOldWay){
  auto v = std::vector<int>{1, 2, 3, 4, 5};
  auto v2 = std::vector<int>{1, 2, 3, 4, 5};

  auto p = std::vector<std::pair<int, int>>{};

  std::transform(
      v.begin(),
      v.end(),
      v2.begin(),
      std::back_inserter(p),
      [](const auto& n1, const auto& n2){
        return std::make_pair(n1, n2);
      });

  auto sum = std::accumulate(
      p.begin(),
      p.end(),
      0,
      [](const auto& acc, const auto& el){
        return acc + el.first + el.second;
      }
      );

  ASSERT_EQ(p[0], std::make_pair(1, 1));
  ASSERT_EQ(sum, 30);
}

TEST(Algos, Map){
  auto m = std::unordered_map<std::string, int>{
      {"hi", 1},
      {"there", 2},
      {"how", 3},
      {"are", 4},
      {"you", 5}
  };

  auto r = std::unordered_map<std::string, int>{};

  std::transform(
      m.begin(),
      m.end(),
      // result.begin(), this would segfault
      std::inserter(r, r.end()),
      [](const auto& p){
        return std::make_pair(p.first, p.second * 2);
      });

  ASSERT_EQ(r["you"], 10);
}
