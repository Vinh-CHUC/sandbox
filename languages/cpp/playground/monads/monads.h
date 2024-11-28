#ifndef MONADS_H
#define MONADS_H
#include "tl/expected.hpp"
#include <string>

tl::expected<std::string, int> build_expected();

#endif
