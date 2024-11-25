#include <gtest/gtest.h>

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

TEST(VStringTest, CopyCtorAndAssignment) {
  VString str("foo");
  VString str2("bar");

  // Copy assignment
  str2 = str;
  ASSERT_EQ(str2.get_copy_count(), 1);
  str2 = str;
  ASSERT_EQ(str2.get_copy_count(), 2);

  // Copy ctr
  VString str3 = str2;
  ASSERT_EQ(str3.get_copy_count(), 3);
}

TEST(VStringTest, MoveAttribute) {
  VString str("foo");

  std::string s = str.move_field_out();

  ASSERT_EQ(str.get(), "");
}
