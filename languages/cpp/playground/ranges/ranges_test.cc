#include <algorithm>
#include <gtest/gtest.h>
#include <iterator>
#include <ranges>
#include <unistd.h>
#include <unordered_map>
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
      // This is because of the C++ iterator model
      // in C++26 std::views::cache_latest will fix this
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

TEST(RangesTest, MoveIterator2) {
  std::vector<std::string> vec = {"apple", "banana", "cherry"};

  auto view = vec | std::views::as_rvalue;

  std::vector<std::string> result;

  std::ranges::copy(view.begin(), view.end(), std::back_inserter(result));

  ASSERT_EQ(result[0], "apple");
  ASSERT_EQ(vec[0], "");
}

TEST(RangesTest, MoveIterator3) {
  std::vector<std::string> vec = {"apple", "banana", "cherry"};

  auto result = vec | std::views::as_rvalue | std::views::transform([](std::string&& s){
      std::string t = std::move(s);
      t.append("_moved");
      return t;
  }) | std::ranges::to<std::vector>();

  ASSERT_EQ(result[0], "apple_moved");
  ASSERT_EQ(vec[0], "");
}

TEST(RangesTest, Zipping) {
  std::vector<std::string> vec = {"apple", "banana", "cherry"};
  std::vector<int> vec2 = {1, 2, 3};

  auto result = std::views::zip(vec, vec2) | std::views::transform([](const auto& t){
    using T = std::remove_cvref_t<decltype(t)>;
    static_assert(std::is_same_v<T, std::tuple<std::string&, int&>>);

    auto [s, i] = t;
    return (s.size() == 5) && (i == 1);
  }) | std::ranges::to<std::vector>();

  ASSERT_EQ(result[0], true);
  ASSERT_EQ(result[1], false);
  ASSERT_EQ(result[1], false);
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
        std::string t = std::move(s);
        t.append("_moved");
        // Here we return by value which explains why we can bind as && in the next
        return t;
      }) |
      std::views::transform([](std::string &&s) { return std::move(s); });
  ASSERT_EQ(rng[0], "apple_moved");
  ASSERT_EQ(vec[0], "");
}

TEST(RangesTest, Map){
  auto m = std::unordered_map<std::string, int>{
      {"hi", 1},
      {"there", 2},
      {"how", 3},
      {"are", 4},
      {"you", 5}
  };

  std::vector<std::string> out = m | std::views::keys | std::views::transform([](const auto& k){
        return k;
  }) | std::ranges::to<std::vector>();

  std::vector<int> out2 = m | std::views::values | std::views::transform([](const auto& v){
        return v;
  }) | std::ranges::to<std::vector>();

  auto out3 = m | std::views::transform([](const auto& pair){
    return std::make_pair(pair.first, pair.second * 2);
  }) | std::ranges::to<std::unordered_map>();

  ASSERT_EQ(out3["you"], 10);
}
