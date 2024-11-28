#include "monads/monads.h"

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
