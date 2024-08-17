#include "VString/VString.h"
#include "vector"

#include <iostream>

int main(int argc, char *argv[]) {
  VString str("hello there");
  VString str2(std::move(str));
  std::cout << str2.get_moves_count() << std::endl;
  return 0;
}
