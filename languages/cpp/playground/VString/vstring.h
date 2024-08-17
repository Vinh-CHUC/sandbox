#ifndef MYSTRING_H
#define MYSTRING_H

#include <iostream>
#include <string>

class VString {
public:
  explicit VString(const std::string &str);

  VString(const VString &other) = default;
  VString(VString &&other) noexcept;

  VString &operator=(const VString &other) = default;
  VString &operator=(VString &&other) noexcept = default;

  ~VString() = default;

  const std::string &get() const;
  int get_moves_count() const;

private:
  int move_constructor_count;
  std::string value;
};

#endif // MYSTRING_H
