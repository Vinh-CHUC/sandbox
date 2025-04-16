#include "cpp_features/move_semantics/move_semantics.h"

VString fn(VString vstr){
  return vstr;
}

VString fn2(VString&& vstr){
  return vstr;
}

VString&& fn3(VString&& vstr){
  return std::move(vstr);
}
