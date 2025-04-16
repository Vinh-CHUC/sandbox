#include "cpp_features/forward/forward.h"

#include <gtest/gtest.h>

TEST(ForwardTest, WithoutForward) {
  int i = 5;
  ASSERT_EQ(basic::wrapper(i), RefType::lref);
  ASSERT_EQ(basic::wrapper(5), RefType::lref);
}

TEST(ForwardTest, WithForward) {
  int i = 5;
  ASSERT_EQ(basic::forwarding_wrapper(i), RefType::lref);
  ASSERT_EQ(basic::forwarding_wrapper(5), RefType::rref);
}

TEST(ForwardTest, MyForward) {
  int i = 5;
  ASSERT_EQ(forward::forwarding_wrapper(i), RefType::lref);
  ASSERT_EQ(forward::forwarding_wrapper(5), RefType::rref);
}
