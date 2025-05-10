#include <gtest/gtest.h>

#include "algos/intervals.h"

TEST(Intervals, Intersection){
  auto int1_opt = Interval::make_interval(1, 3);
  auto int2_opt = Interval::make_interval(2, 4);
  auto int3 = Interval::make_interval(10, 15).value();

  ASSERT_TRUE(int1_opt.has_value());
  ASSERT_TRUE(int2_opt.has_value());

  auto int1 = int1_opt.value();
  auto int2 = int2_opt.value();

  ASSERT_TRUE(int1.intersects_with(int2));
  ASSERT_FALSE(int3.intersects_with(int2));
}

TEST(Intervals, Merge){
  auto input = std::vector<Interval>{
    Interval::make_interval(1, 3).value(),
    Interval::make_interval(2, 6).value(),
    Interval::make_interval(8, 10).value(),
    Interval::make_interval(15, 18).value()
  };
  auto expected = std::vector<Interval>{
      Interval::make_interval(1, 6).value(),
      Interval::make_interval(8, 10).value(),
      Interval::make_interval(15, 18).value()
  };

  auto actual = merge_intervals(input);
  ASSERT_EQ(actual, expected);
};

TEST(Intervals, MergeRec){
  auto input = std::vector<Interval>{
    Interval::make_interval(1, 3).value(),
    Interval::make_interval(2, 6).value(),
    Interval::make_interval(8, 10).value(),
    Interval::make_interval(15, 18).value()
  };
  auto expected = std::vector<Interval>{
      Interval::make_interval(1, 6).value(),
      Interval::make_interval(8, 10).value(),
      Interval::make_interval(15, 18).value()
  };

  auto actual = merge_intervals_rec(input);
  ASSERT_EQ(actual, expected);
};
