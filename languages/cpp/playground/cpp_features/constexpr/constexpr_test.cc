#include "cpp_features/constexpr/constexpr.h"

#include <gtest/gtest.h>

TEST(ConstExpr, Basic) {
  static_assert(A::is_valid);
  static_assert(!B::is_valid);
  static_assert(!C::is_valid);
  static_assert(D::is_valid);
}
