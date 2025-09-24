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

#endif
