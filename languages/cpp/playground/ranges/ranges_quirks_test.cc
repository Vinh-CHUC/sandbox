#include <cassert>
#include <ranges>
#include <string>

#include <gtest/gtest.h>

TEST(RangesQuirksTest, RValueContainersDontGiveRHSRefs){
  std::vector<std::string> vec = {"apple", "banana", "cherry"};

  // This is because the for loop desugars to stuff that reintroduces lvalues?
  for(auto it: std::move(vec)){}
  ASSERT_EQ(vec[0], "apple");

  for(auto it: vec | std::views::as_rvalue){}
  ASSERT_EQ(vec[0], "");
}

TEST(RangesQuirksTest, FilterCausesMultipleEvaluations){
  std::vector<std::string> vec = {"apple", "banana", "cherry"};

  auto ret = vec | std::views::transform([](std::string& el){
      el.append("hi");
      return el;
    }) | std::views::filter([](std::string el){
      return true;
    }) | std::ranges::to<std::vector>();

  ASSERT_EQ(vec[0], "applehihi");

  // Because the views filter internally
  // ++it searches for the next element that satisfies the predicate -> has to call the underlying
  // transform
  //
  // *it dereferences the element, it has to evaluated transform again!! as the step above did not
  // save the result
  //
  // With Python/Rust iterator model, it'd be instead something like
  //
  // let el = internal_it.next();
  //
  // while (el && !pred(*el)) {
  //     el = internal_it.next();
  // }
  //
  // return el;
}
