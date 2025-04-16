#ifndef BUILDER_H
#define BUILDER_H

#include <cwchar>
#include <string>

// A contains one B and many Cs
class B {
public:
  std::string x;
};

class BBuilder {
public:
  std::string x;

  explicit BBuilder();
  B build();

  BBuilder &setx(const std::string &s);
  BBuilder &setx(std::string &&s);
};

class A {
public:
  std::string x;
  B b;
};

class ABuilder {
public:
  std::string x;
  BBuilder b_builder;

  int move_count;

  explicit ABuilder();
  A build();

  ABuilder &setx(const std::string &s);
  ABuilder &setb_builder(const BBuilder &bb);

  ABuilder &setx(std::string &&s);
  ABuilder &setb_builder(BBuilder &&s);
};

#endif // BUILDER_H
