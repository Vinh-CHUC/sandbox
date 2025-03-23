#include "functor/functor.h"

#include <gtest/gtest.h>
#include <iostream>
#include <string>

std::string tstr(int val) { return std::to_string(val); }
const int a = 10;

// std::function does not play well with overload resolution
/* std::string tstr(float val) { */
/*     return std::to_string(val); */
/* } */

TEST(FunctorTest, Basic) {
  Functor<int> int_container = {.val = a};
  Functor<std::string> str_container = int_container.map<std::string>(tstr);
  auto str_container2 = int_container.map<std::string>(tstr);

  /* Cannot infer type, have to say map<std::string> */
  /* Functor<std::string> str_container2 = int_container.map(tstr); */
}

TEST(FunctorTest, Advanced) {
  MyClassPlain a;
  MyClassSharedPtr b;
}
