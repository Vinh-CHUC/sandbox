#include <algorithm>
#include <gtest/gtest.h>
#include <iostream>
#include <iterator>
#include <ranges>
#include <vector>


TEST(RangesTest, CopyViewIntoAnotherVector) {
    std::vector<std::string> vec = {"one", "two", "three"};
    auto view = vec
      // The first transform cannot acquire a rhs on the vec elements as vec and its elements are
      // lvalues?
      // So we have to std::move
      | std::views::transform([](std::string& s) { return std::move(s); })
      // Beyond the first transform, everything can flow as rhs
      | std::views::transform([](std::string&& s) {
          s.append("_moved");
          // No need to std::move again from now onwards as everything is a temp, ie rhs
          return s;
      })
      // Interestingly the compiler complains if I try to bind as a std::string& (rightly so?)
      | std::views::transform([](std::string&& s) {
          s.append("_moved");
          return s;
      })
      // Generally it's not really possible to filter after a transform move?:
      /* | std::views::filter([](const std::string& s) { */
      /*     return true; */
      /* }) */
    ;
    std::vector<std::string> result;

    std::ranges::copy(
        std::make_move_iterator(view.begin()),
        std::make_move_iterator(view.end()),
        std::back_inserter(result));

    ASSERT_EQ(result[0], "one_moved_moved");
    ASSERT_EQ(vec[0], "");
}

TEST(RangesTest, MoveIterator) {
  std::vector<std::string> vec = {"apple", "banana", "cherry"};
  std::vector<std::string> result;

  // Use ranges::transform with move_iterator
  std::transform(std::make_move_iterator(vec.begin()),
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

TEST(RangesTest, ViewsTransformInputModified) { std::vector<std::string> vec = {"apple", "banana", "cherry"};
  // iiuc views transform can either pass by value of reference
  auto rng = vec | std::views::transform([](std::string &s) {
               s.append("_pwned");
               return s.size();
             }) |
             std::views::transform([](int size) { return 2 * size; });
  // Swapping the order of the assert would make this fail
  // Why?? The views are lazy so one needs to access the result for the pipeline to "run"
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
