#include "ranges_v3.h"
#include <expected>

std::function<ranges::any_view<std::string>()> getStringRanges(){
  std::expected<std::string, const char*> yo = "hi";
  std::vector<std::string> vec = {"one", "one", "one"};
  return [vec](){
    return vec | ranges::views::all;
  };
}
