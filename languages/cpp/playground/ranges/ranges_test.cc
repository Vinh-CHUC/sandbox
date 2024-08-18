#include <algorithm>
#include <gtest/gtest.h>
#include <iostream>
#include <iterator>
#include <ranges>
#include <vector>

TEST(RangesTest, MoveIterator) {
  std::vector<std::string> vec = {"apple", "banana", "cherry"};
  std::vector<std::string> result;

  // Use ranges::transform with move_iterator
  std::ranges::transform(std::make_move_iterator(vec.begin()),
                         std::make_move_iterator(vec.end()),
                         std::back_inserter(result), [](std::string &&s) {
                           // Transform the string by appending " (moved)" to it
                           return std::move(s) + " (moved)";
                         });

  ASSERT_EQ(result[0], "apple (moved)");
  ASSERT_EQ(vec[0], "");
}

TEST(RangesTest, ViewsTransformInputNotTouched) {
  std::vector<std::string> vec = {"apple", "banana", "cherry"};
  // iiuc views transform can either pass by value of reference
  auto rng =
      vec |
      std::views::transform([](const std::string &s) { return s.size(); }) |
      std::views::transform([](int size) { return 2 * size; });
  ASSERT_EQ(rng[0], 10);

  ASSERT_EQ(vec[0], "apple");
}

TEST(RangesTest, ViewsTransformInputModified) {
  std::vector<std::string> vec = {"apple", "banana", "cherry"};
  // iiuc views transform can either pass by value of reference
  auto rng = vec | std::views::transform([](std::string &s) {
               s.append("_pwned");
               return s.size();
             }) |
             std::views::transform([](int size) { return 2 * size; });
  ASSERT_EQ(rng[0], 22);

  ASSERT_EQ(vec[0], "apple_pwned");
}

TEST(RangesTest, ViewsTransformInputMoved) {
  std::vector<std::string> vec = {"apple", "banana", "cherry"};
  auto rng =
      vec | std::views::transform([](std::string &s) {
        auto t = std::move(s);
        t.append("_moved");
        return t;
      }) |
      std::views::transform([](std::string &&s) { return std::move(s); });
  ASSERT_EQ(rng[0], "apple_moved");
  ASSERT_EQ(vec[0], "");
}
