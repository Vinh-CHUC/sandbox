#include "ranges_v3.h"
#include <expected>

std::function<ranges::any_view<std::string>()> getStringRanges(){
  std::expected<std::string, const char*> yo = "hi";
  std::vector<std::string> vec = {"one", "one", "one"};
  return [vec](){
    return vec | ranges::views::all;
  };
}

std::function<ranges::any_view<std::reference_wrapper<std::string>, ranges::category::forward>()> getMutableStringRanges(){
    std::vector<std::string> vec = {"one", "two", "three"};
    return [vec]() mutable {
      ranges::any_view<std::reference_wrapper<std::string>, ranges::category::forward> it = (
          vec | ranges::views::transform([](auto& s){return std::ref(s);})
      );
      return it;
    };
}
