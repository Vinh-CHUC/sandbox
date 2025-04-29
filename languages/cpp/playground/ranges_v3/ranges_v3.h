#ifndef RANGES_V3
#define RANGES_V3

#include <string>

#include <range/v3/all.hpp>
#include <functional>

std::function<ranges::any_view<std::string>()> getStringRanges();

#endif
