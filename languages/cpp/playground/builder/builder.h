#ifndef BUILDER_H
#define BUILDER_H

#include <cwchar>
#include <string>

class A {
public:
  std::string a;
  std::string b;
  std::string c;
};

class ABuilder {
public:
  std::string a;
  std::string b;
  std::string c;
  int move_count;

  explicit ABuilder();
  A build();

  ABuilder &seta(const std::string &s);
  ABuilder &setb(const std::string &s);
  ABuilder &setc(const std::string &s);

  ABuilder &seta(std::string &&s);
  ABuilder &setb(std::string &&s);
  ABuilder &setc(std::string &&s);
};

#endif // BUILDER_H
