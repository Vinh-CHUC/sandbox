#ifndef MOVE_SEMANTICS_H
#define MOVE_SEMANTICS_H
#include "vstring/vstring.h"

VString fn(VString vstr);
// Having both creates ambiguous call:
// - fn(std::move(str)) can both call fn below
// - as well as fn above leveraging VString move constructor
// VString fn(VString&& vstr);

VString fn2(VString &&vstr);

VString &&fn3(VString &&vstr);

VString fn4(VString &&vstr);
VString fn5(VString &&vstr);
VString fn6(VString &&vstr);

struct MoveOnlyString {
  std::string value;

  explicit MoveOnlyString(std::string v) : value(std::move(v)) {}

  // Move-only
  MoveOnlyString(MoveOnlyString &&) = default;
  MoveOnlyString &operator=(MoveOnlyString &&) = default;

  MoveOnlyString(const MoveOnlyString &) = delete;
  MoveOnlyString &operator=(const MoveOnlyString &) = delete;
};

void consume(MoveOnlyString s);

#endif
