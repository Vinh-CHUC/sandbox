#include "cpp_features/rvo/rvo.h"

#include <string>
#include <vector>

void mutate_vec(std::vector<std::string> &vec){
  vec.push_back("hello");
  vec.push_back("there");
}

VString build_vstring() {
  return VString(std::string("hi"));
}

VString build_vstring2() {
  VString str(std::string("hi"));
  return str;
}

VString pass_along() {
  VString str = build_vstring2();
  return str;
}

A build_a(){
  return A{
    .v = pass_along()
  };
}

// NRVO doesn't apply
VString build_vstring3() {
  VString str(std::string("hi"));
  VString str2(std::string("hello there"));

  if (str.get_copy_count() < str2.get_copy_count()){
    return str;
  } else {
    return str2;
  }
}
