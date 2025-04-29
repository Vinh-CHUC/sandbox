#include <range/v3/all.hpp>
#include <vector>
#include <string>
#include <gtest/gtest.h>

#include "ranges_v3/ranges_v3.h"


TEST(RangesV3Test, MoveIntoAnotherVector) {
    std::vector<std::string> vec = {"one", "two", "three"};
    auto moved_vector = vec | ranges::views::move | ranges::to<std::vector>();
    ASSERT_EQ(vec[0], "");

    auto yo{5};
    std::cout << yo + 6 << std::endl;
}

TEST(RangesV3Test, FilterMinMap) {
    int ref = 6;
    std::vector<int> vec = {1, 2, 3, 4, 5};
    auto buildings = vec
      | ranges::views::filter([](const int &el) {
          return true;
        });

    auto min = ranges::min(
      buildings,
      [&](const int& a, const int& b){return std::abs(ref - a) < std::abs(ref - b);}
    );
    ASSERT_EQ(min, 5);
}

TEST(RangesV3Test, MoveAndTransformIntoAnotherVector) {
    std::vector<std::string> vec = {"one", "two", "three"};
    auto moved_vector = vec
      | ranges::views::move
      | ranges::views::transform([](std::string &&s) {
          s.append("_transformed");
          return s;
        })
      | ranges::views::filter([](const std::string &s) {
          return true;
        })
      | ranges::to<std::vector>();
    ASSERT_EQ(vec[0], "");
    ASSERT_EQ(moved_vector[0], "_transformed");

    /*
    if filter_fn(transform_fn(el)):
      yield transform_fn(el)

    ++(it)
    *it

    */
}

TEST(RangesV3Test, CopyIntoAnother){
  std::vector<std::string> vec = {"one", "two", "three"};
  auto copied_vector = vec
    // Copy at the lambda level
    | ranges::views::transform([](std::string s) {
        s.append("_copied");
        return s;
      })
    | ranges::to<std::vector>();
  ASSERT_EQ(vec[0], "one");
  ASSERT_EQ(copied_vector[0], "one_copied");
}

TEST(RangesV3Test, CopyIntoAnother2){
  std::vector<std::string> vec = {"one", "two", "three"};
  auto copied_vector = vec
    | ranges::views::transform([](const std::string &s) {
        // Or copy within here
        std::string t = s;
        t.append("_copied");
        return t;
      })
    | ranges::to<std::vector>();
  ASSERT_EQ(vec[0], "one");
  ASSERT_EQ(copied_vector[0], "one_copied");
}

TEST(RangesV3Test, AnyView){
  std::vector<std::string> vec = getStringRanges()() | ranges::to<std::vector>();
  ASSERT_EQ(vec[0], "one");

  auto r = getStringRanges();
  for(const auto& s: r()){
    ASSERT_EQ(s, "one"); 
  }

  /* for(const auto& s: getStringRanges()()){ */
  /*   ASSERT_EQ(s, "one"); */ 
  /* } */
}
