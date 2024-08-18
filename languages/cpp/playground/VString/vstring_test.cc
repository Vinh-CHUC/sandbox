#include <gtest/gtest.h>
#include <iostream>

#include "vstring/vstring.h"

TEST(VStringTest, MoveSemanticsBacics) {
  VString str("hello there");
  VString str2(std::move(str));
  VString str3(std::move(str2));

  ASSERT_EQ(str3.get_moves_count(), 2);
  ASSERT_EQ(str3.get(), "hello there");

  // clang-tidy will warn about this
  /* ASSERT_EQ(str2.get(), ""); */
}

TEST(VStringTest, MoveSemanticsConsumeFromMethod) {
  VString str("hello there");
  VString str2 = str.consume();

  ASSERT_EQ(str2.get_moves_count(), 1);
  ASSERT_EQ(str2.get(), "hello there");

  // clang-tidy will not warn about this!!!
  ASSERT_EQ(str.get(), "");
}
