#include "patterns/type_erasure/type_erasure.h"

#include <gtest/gtest.h>
#include <memory>

struct X {
  std::string foo(){return "I am X";} 
};

struct Y {
  std::string foo(){return "I am Y";} 
};

TEST(TypeErasure, Basic){
  // Not a great interface, these details are leaked:
  // - The fact that things are templated
  // - The pointer (here shared_ptr)
  using namespace Basic;
  std::shared_ptr<A> p = std::make_shared<Derived<X>>(X{});
  ASSERT_EQ(p->foo(), "I am X");
  p = std::make_shared<Derived<Y>>(Y{});
  ASSERT_EQ(p->foo(), "I am Y");
}

struct X2 {
  std::string name;
  std::string speak(){return name;}
  int id(){return 1;}
};

struct Y2 {
  std::string name;
  std::string family;
  std::string speak(){return name + " " + family;}
  int id(){return 1;}
};

TEST(TypeErasure, Better){
  using namespace Better;

  Entity a = Entity(X2{.name = "Vinh"});
  ASSERT_EQ(a.speak(), "Vinh");

  Entity b = Entity(Y2{.name = "Vinh", .family = "Chuc"});
  ASSERT_EQ(b.speak(), "Vinh Chuc");
}
