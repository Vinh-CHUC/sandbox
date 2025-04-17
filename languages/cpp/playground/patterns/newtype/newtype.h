#ifndef NEWTYPE_H
#define NEWTYPE_H

#include <string>

enum class Tag {
  FOO,
  BAR
};

namespace One {
  template<Tag t>
  struct A {
    std::string val;
  };

  std::string fn1(A<Tag::FOO> a){
    return a.val; 
  }

  void fn2(){
    // The below wouldn't compile
    /* auto b = A<Tag::BAR>{}; */
    auto b = A<Tag::FOO>{};
    fn1(b);
  }
}

namespace Two {
  struct A {
    std::string val;
    A(const std::string& s):val(s){}
    A(const A&) = delete;
    A& operator= (const A&) = delete;
    ~A(){};
  };

  template<Tag t> using AT = A;

  std::string fn1(AT<Tag::FOO>& a){
    return a.val; 
  }

  void fn2(){
    // This does compile!!!
    auto b = AT<Tag::BAR>{std::string{"yoo"}};
    fn1(b);
  }
}

#endif
