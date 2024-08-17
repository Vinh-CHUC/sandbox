#include <gtest/gtest.h>
#include <iostream>

#include "vstring/vstring.h"

// Demonstrate some basic assertions.
TEST(HelloTest, BasicAssertions) {
  VString str("hello there");
  VString str2(std::move(str));
  VString str3(std::move(str2));
  ASSERT_EQ(str3.get_moves_count(), 2);
}
