#include "forward/forward.h"

#include <gtest/gtest.h>

TEST(ForwardTest, WithoutForward) {
  int i = 5;
  ASSERT_EQ(wrapper(i), RefType::lref);
  ASSERT_EQ(wrapper(5), RefType::lref);
}

TEST(ForwardTest, WithForward) {
  int i = 5;
  ASSERT_EQ(forwarding_wrapper(i), RefType::lref);
  ASSERT_EQ(forwarding_wrapper(5), RefType::rref);
}

TEST(ForwardTest, MyForward) {
  int i = 5;
  /* myforward<int&>(5); */
}
