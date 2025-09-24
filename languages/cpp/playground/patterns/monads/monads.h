#ifndef MONADS_H
#define MONADS_H
#include "tl/expected.hpp"
#include "tl/optional.hpp"
#include <functional>
#include <string>

class EBuilder {
public:
  EBuilder();

  EBuilder &setA(std::string a);
  EBuilder &setB(std::string b);
  EBuilder &setC(std::string c);

  const tl::optional<std::string> &getD();
  const tl::optional<std::string> &getE();
  const tl::optional<std::string> &getF();

  tl::expected<std::reference_wrapper<EBuilder>, std::string>
  setD(const std::string &e);
  tl::expected<std::reference_wrapper<EBuilder>, std::string>
  setE(const std::string &f);
  tl::expected<std::reference_wrapper<EBuilder>, std::string>
  setF(const std::string &g);

private:
  std::string a;
  std::string b;
  std::string c;
  tl::optional<std::string> d;
  tl::optional<std::string> e;
  tl::optional<std::string> f;
};

tl::expected<EBuilder, std::string> build_expected(const std::string &a,
                                                   const std::string &b,
                                                   const std::string &c);

#endif
