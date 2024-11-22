#include "rvo/rvo.h"
#include <string>
#include <vector>

void mutate_vec(std::vector<std::string> &vec){
  vec.push_back("hello");
  vec.push_back("there");
}

std::vector<std::string> build_vec() {
  std::vector<std::string> vec = {"hello", "there"};
  return vec;
}
