#include "builder/builder.h"

#include <gtest/gtest.h>
#include <iostream>

TEST(BuilderTest, Basic) {
  ABuilder a_builder;
  A a = a_builder.seta("yoo").setb("haha").build();

  ASSERT_EQ(a.a, "yoo");
  ASSERT_EQ(a.b, "haha");

  // Clang-tidy does not warn about this!!!
  ASSERT_EQ(a_builder.a, "");
  ASSERT_EQ(a_builder.b, "");
}

TEST(BuilderTest, CheckMoveSemantics) {
  std::string str = "foobar";
  ABuilder a_builder = ABuilder().seta("yoo").setb("haha").setc(str);
  ASSERT_EQ(a_builder.move_count, 2);

  ABuilder a_builder_2 =
      ABuilder().seta("yoo").setb("haha").setc(std::move(str));
  ASSERT_EQ(a_builder_2.move_count, 3);
}

TEST(BuilderTest, MoveNoop) {
  // Note the const!!!
  const std::string str = "foobar";
  ABuilder a_builder = ABuilder().seta("yoo").setb("haha").setc(std::move(str));
  ASSERT_EQ(a_builder.move_count, 2);
}
