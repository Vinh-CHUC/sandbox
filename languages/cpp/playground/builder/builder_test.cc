#include "builder/builder.h"

#include <gtest/gtest.h>
#include <iostream>

TEST(BuilderTest, Basic) {
  ABuilder a_builder;
  BBuilder b_builder = BBuilder().setx("bar");
  A a = a_builder.setx("foo").setb_builder(b_builder).build();

  ASSERT_EQ(a.x, "foo");
  ASSERT_EQ(a.b.x, "bar");

  // Clang-tidy does not warn about this!!!
  ASSERT_EQ(a_builder.x, "");
  ASSERT_EQ(a_builder.b_builder.x, "");
}

TEST(BuilderTest, CheckMoveSemantics) {
  std::string str = "foobar";
  ABuilder a_builder = ABuilder().setx(str).setb_builder(BBuilder());
  ASSERT_EQ(a_builder.move_count, 1);

  ABuilder a_builder_2 = ABuilder().setx("yoo").setb_builder(BBuilder());
  ASSERT_EQ(a_builder_2.move_count, 2);
}

TEST(BuilderTest, MoveNoop) {
  // Note the const!!!
  const std::string str = "foobar";
  ABuilder a_builder = ABuilder().setx(std::move(str)).setb_builder(BBuilder());
  ASSERT_EQ(a_builder.move_count, 1);
}
