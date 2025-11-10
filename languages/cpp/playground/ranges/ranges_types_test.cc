#include <cassert>
#include <ranges>
#include <string>

#include <gtest/gtest.h>

TEST(RangesTypesTest, Simple) {
  std::vector<std::string> vec = {"apple", "banana", "cherry"};

  for (auto it : vec){
    static_assert(std::is_same_v<decltype(it), std::string>);
  }

  for (auto& it : vec){
    static_assert(std::is_same_v<decltype(it), std::string&>);
  }

  for (auto& it : vec | std::views::as_const){
    static_assert(std::is_same_v<decltype(it), const std::string&>);
  }

  for (const auto& it : vec){
    static_assert(std::is_same_v<decltype(it), const std::string&>);
  }

  for (auto it : vec | std::views::as_rvalue){
    static_assert(std::is_same_v<decltype(it), std::string>);
  }
  ASSERT_EQ(vec[0], "");

  vec = {"apple", "banana", "cherry"};

  // Won't compile
  // for (auto& it : vec | std::views::as_rvalue){}

  for (const auto& it : vec | std::views::as_rvalue){
    static_assert(std::is_same_v<decltype(it), const std::string&>);
  }

  // Didn't actually move
  ASSERT_EQ(vec[0], "apple");

  for (auto&& it : vec | std::views::as_rvalue){
    static_assert(std::is_same_v<decltype(it), std::string&&>);
  }

  // Didn't actually move
  ASSERT_EQ(vec[0], "apple");
}

TEST(RangesTypesTest, Zipping) {
  std::vector<std::string> vec = {"apple", "banana", "cherry"};
  std::vector<int> vec2 = {1, 2, 3};

  for (const auto& it : std::views::zip(vec, vec2)){
    static_assert(std::is_same_v<decltype(it), const std::tuple<std::string&, int&>&>);
    auto [s, i] = it;
    static_assert(std::is_same_v<decltype(s), std::string&>);
    s = "hello";
  }
  // The const as the zip level doesn't const the things inside
  ASSERT_EQ(vec[0], "hello");

  vec = {"apple", "banana", "cherry"};
  for (auto it : std::views::zip(vec, vec2)){
    static_assert(std::is_same_v<decltype(it), std::tuple<std::string&, int&>>);
    auto [s, i] = it;
    static_assert(std::is_same_v<decltype(s), std::string&>);
    s = "hello";
  }
  ASSERT_EQ(vec[0], "hello");

  // Not very useful...
  vec = {"apple", "banana", "cherry"};
  for (auto&& it : std::views::zip(vec, vec2)){
    static_assert(std::is_same_v<decltype(it), std::tuple<std::string&, int&>&&>);
    auto [s, i] = it;
    static_assert(std::is_same_v<decltype(s), std::string&>);
    s = "hello";
  }
  ASSERT_EQ(vec[0], "hello");

  //////////////////////////////////
  // Moving before passing to zip //
  //////////////////////////////////

  vec = {"apple", "banana", "cherry"};
  for (auto it : std::views::zip(vec | std::views::as_rvalue, vec2 | std::views::as_rvalue)){
    static_assert(std::is_same_v<decltype(it), std::tuple<std::string&&, int&&>>);

    // Note here we can't copy the tuple, otherwise we'd have multiple things owning rvalues
    auto& [s, i] = it;
    static_assert(std::is_same_v<decltype(s), std::string&&>);
    std::string tmp = std::move(s);
  }
  ASSERT_EQ(vec[0], "");
}
