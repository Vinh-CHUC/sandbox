#ifndef MYSTRING_H
#define MYSTRING_H

#include <string>

class VString {
public:
  explicit VString(const std::string &str);

  VString(const VString &other);
  VString(VString &&other) noexcept;

  VString &operator=(const VString &other);
  VString &operator=(VString &&other) noexcept = default;

  ~VString() = default;

  const std::string &get() const;
  int get_moves_count() const;
  int get_copy_count() const;

  VString &&consume();

private:
  int move_constructor_count;
  int copy_count;
  std::string value;
};

#endif // MYSTRING_H
