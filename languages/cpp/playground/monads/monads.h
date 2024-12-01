#ifndef MONADS_H
#define MONADS_H
#include "tl/expected.hpp"
#include "tl/optional.hpp"
#include <functional>
#include <string>

class EBuilder {
  public:
    EBuilder();

    EBuilder& setA(std::string a);
    EBuilder& setB(std::string b);
    EBuilder& setC(std::string c);
    tl::expected<std::reference_wrapper<EBuilder>, std::string> setD(std::string e);
    tl::expected<std::reference_wrapper<EBuilder>, std::string> setE(std::string f);
    tl::expected<std::reference_wrapper<EBuilder>, std::string> setF(std::string g);

  private:
    std::string a;
    std::string b;
    std::string c;
    tl::optional<std::string> d;
    tl::optional<std::string> e;
    tl::optional<std::string> f;
};

tl::expected<std::reference_wrapper<EBuilder>, std::string> build_expected();

#endif
