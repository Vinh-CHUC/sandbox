#include "cpp_features/init_conv/init_conv.h"

#include <gtest/gtest.h>

TEST(InitConv, ExplicitConversion){
  B b {std::string{"hello"}};

  // Cannot use explicit conversion
  /* A a = b; */
  /* A a = {b}; */

  // The use of list initialisation is irrelevant/orthogonal to
  // implicit conversions

  A a{b};
  A a2(b);

  auto a3 = A(b);
  auto a4 = A{b};
}

// A makeB(){return {B{}};}
// A makeB(){return B{};}
