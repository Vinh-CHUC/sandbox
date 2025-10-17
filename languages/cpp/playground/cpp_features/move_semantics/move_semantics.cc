#include "cpp_features/move_semantics/move_semantics.h"

// https://en.cppreference.com/w/cpp/language/return.html
// Section: Automatic move from local variables and parameters

VString fn(VString vstr) { return vstr; }

VString fn2(VString &&vstr) { return vstr; }

VString &&fn3(VString &&vstr) { return vstr; }

// Use case:
// - Only allows move, more explicit signal: consuming only
VString fn4(VString &&vstr) {
  // The std::move is absolutely necessary!!
  return VString(std::move(vstr));
}

VString fn5(VString &&vstr) {
  // The std::move is absolutely necessary!!
  return VString(vstr);
}

VString fn6(VString &&vstr) {
  // This is a no-op thankfully
  std::move(vstr);
  return VString(vstr);
}
