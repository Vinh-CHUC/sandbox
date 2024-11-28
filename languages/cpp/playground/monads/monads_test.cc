#include "monads/monads.h"

#include <gtest/gtest.h>


TEST(Monads, Expected){
  auto exp = build_expected();
  ASSERT_TRUE(exp.has_value());
}
