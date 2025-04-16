#include "patterns/monads/monads.h"

#include <gtest/gtest.h>

TEST(Monads, Expected){
  auto foo = tl::expected<std::string, int>{ std::string{}};
  auto bar = foo.and_then(
      [](const std::string& str){return tl::expected<std::string, int>{str};}
  );
  ASSERT_TRUE(bar.has_value());
}

TEST(Monads, Unexpected){
  tl::expected<std::string, int> foo = tl::unexpected<int>{ 1 };
  ASSERT_FALSE(foo.has_value());
}

TEST(Monads, AndThen){
  auto foo = tl::expected<std::string, int>{ std::string{}};
  auto bar = foo.and_then(
      [](const std::string& str){
        return tl::expected<std::string, int>{tl::unexpected<int>(1)};
      }
  );
  ASSERT_FALSE(bar.has_value());
}

TEST(Monads, ExpectedBuilder){
  auto built = build_expected("one", "two", "three");
  ASSERT_TRUE(built.has_value());
  ASSERT_EQ(built.value().getD().value(), "one");
  ASSERT_EQ(built.value().getE().value(), "two");
  ASSERT_EQ(built.value().getF().value(), "three");
}
