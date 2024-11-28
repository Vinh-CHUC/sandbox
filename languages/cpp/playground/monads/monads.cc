#include "monads/monads.h"

tl::expected<std::string, int> build_expected() {
  return tl::expected<std::string, int>{std::string{}};
}
