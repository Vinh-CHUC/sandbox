#include "monads/monads.h"
#include <functional>

EBuilder::EBuilder(): a(""), b(""), c(""){}

EBuilder& EBuilder::setA(std::string str){
  a = std::move(str);
  return *this;
}

EBuilder& EBuilder::setB(std::string str){
  b = std::move(str);
  return *this;
}

EBuilder& EBuilder::setC(std::string str){
  c = std::move(str);
  return *this;
}

tl::expected<std::reference_wrapper<EBuilder>, std::string> EBuilder::setD(std::string str){
  d = tl::make_optional(std::move(str));
  return {std::ref(*this)};
}

tl::expected<std::reference_wrapper<EBuilder>, std::string> EBuilder::setE(std::string str){
  e = tl::make_optional(std::move(str));
  return {std::ref(*this)};
}

tl::expected<std::reference_wrapper<EBuilder>, std::string> EBuilder::setF(std::string str){
  f = tl::make_optional(std::move(str));
  return {std::ref(*this)};
}

tl::expected<std::reference_wrapper<EBuilder>, std::string> build_expected(
    std::string d,
    std::string e,
    std::string f
){
  auto builder = EBuilder{};
  return builder.setD("hello").and_then(
    [&](auto b){
      return b.get().setD(d);
    }
  ).and_then(
    [&](auto b){
      EBuilder& _b = b; return _b.setE(e);
    }
  ).and_then(
    [&](auto b){
      EBuilder& _b = b; return _b.setF(f);
    }
  );
}
