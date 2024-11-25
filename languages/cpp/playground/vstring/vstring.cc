#include <iostream>

#include "vstring/vstring.h"

VString::VString(const std::string &str)
    : move_constructor_count(0), copy_count(0), value(str) {
  std::cout << "Normal constructor" << std::endl;
}

VString::VString(const VString &other)
    : move_constructor_count(0), copy_count(other.copy_count + 1), value(other.value) {
  std::cout << "Normal constructor" << std::endl;
}

VString& VString::operator=(const VString &other){
  copy_count++;
  value = other.value;
  return *this;
}

VString& VString::operator=(VString &&other) noexcept {
  move_constructor_count++;
  value = std::move(other.value);
  return *this;
}

const std::string &VString::get() const { return value; }

VString &&VString::consume() { return std::move(*this); }

int VString::get_moves_count() const { return move_constructor_count; }
int VString::get_copy_count() const { return copy_count; }

VString::VString(VString &&other) noexcept
    : move_constructor_count(other.move_constructor_count), copy_count(other.copy_count),
      value(std::move(other.value)) {
  std::cout << "Move constructor" << std::endl;
  move_constructor_count++;
}
