#include "cpp_features/move_semantics/move_semantics.h"

// https://en.cppreference.com/w/cpp/language/return.html
// Section: Automatic move from local variables and parameters

VString fn(VString vstr){
  return vstr;
}

VString fn2(VString&& vstr){
  return vstr;
}

VString&& fn3(VString&& vstr){
  return vstr;
}
