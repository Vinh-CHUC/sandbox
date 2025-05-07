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
