#ifndef MONADS_H
#define MONADS_H
#include "tl/expected.hpp"
#include "tl/optional.hpp"
#include <string>

tl::expected<std::string, int> build_expected();

class EBuilder {
  EBuilder();

  EBuilder& setA(std::string&& a);
  EBuilder& setB(std::string&& b);
  EBuilder& setC(std::string&& c);

  private:
    tl::optional<std::string> a;
    tl::optional<std::string> b;
    tl::optional<std::string> c;
};

#endif
