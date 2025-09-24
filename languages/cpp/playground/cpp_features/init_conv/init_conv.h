#ifndef INIT_CONV_H
#define INIT_CONV_H

#include <cstdint>
#include <string>

struct C {
  std::string val;
  uint8_t idx;
  std::string yo;
};

struct B {
  std::string val;
};

struct A {
  std::string val;
  std::string val2;
  A(const B &b, const B &b2) : val(b.val), val2(b2.val) {}
  explicit A(const B &b) : val(b.val) {}
};

#endif // INIT_CONV_H
