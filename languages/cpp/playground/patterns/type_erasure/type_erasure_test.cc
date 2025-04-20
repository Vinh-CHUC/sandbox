#include "patterns/type_erasure/type_erasure.h"

#include <iostream>
#include <gtest/gtest.h>
#include <memory>

struct X {
  std::string foo(){return "I am X";} 
};

TEST(TypeErasure, Basic){
  // Not a great interface, these details are leaked:
  // - The fact that things are templated
  // - The pointer (here shared_ptr)
  using namespace Basic;
  std::shared_ptr<A> p = std::make_shared<Derived<X>>(X{});
  ASSERT_EQ(p->foo(), "I am X");
}
