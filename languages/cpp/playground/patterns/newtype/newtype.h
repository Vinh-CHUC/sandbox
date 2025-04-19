#ifndef NEWTYPE_H
#define NEWTYPE_H

#include <string>

#include <boost/serialization/strong_typedef.hpp>

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

namespace Three {
  struct MyString{
    std::string val;
    std::string operator*(const MyString& other){return val + other.val;}
    bool operator==(const MyString& other) const {return val == other.val;}
    bool operator<(const MyString& other) const {return val == other.val;}
  };
  std::string operator+(const MyString& lhs, const MyString& rhs){return lhs.val + rhs.val;}
  
  BOOST_STRONG_TYPEDEF(MyString, MyString2);
  BOOST_STRONG_TYPEDEF(MyString, MyString3);

  void foo(MyString2 str){};
  void bar(){
    MyString2 str2{};
    MyString3 str3{};
    foo(str2);
    /* foo(str3); */
    str2 + str3;
    str2.t * str3;
  }

}

#endif
