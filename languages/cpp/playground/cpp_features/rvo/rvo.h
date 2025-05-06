#ifndef RVO_H
#define RVO_H
#include "vstring/vstring.h"

#include <string>
#include <vector>

struct A {
  VString v;
};

void mutate_vec(std::vector<std::string>& vec);
VString build_vstring();
VString build_vstring2();
VString pass_along();
VString build_vstring3();

A build_a();
A build_then_assign();

#endif // MYSTRING_H
