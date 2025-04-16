#include "patterns/monads/monads.h"
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

const tl::optional<std::string>& EBuilder::getD(){
  return d;
}

const tl::optional<std::string>& EBuilder::getE(){
  return e;
}

const tl::optional<std::string>& EBuilder::getF(){
  return f;
}

tl::expected<std::reference_wrapper<EBuilder>, std::string> EBuilder::setD(const std::string& str){
  d = tl::make_optional(std::move(str));
  return {std::ref(*this)};
}

tl::expected<std::reference_wrapper<EBuilder>, std::string> EBuilder::setE(const std::string& str){
  e = tl::make_optional(std::move(str));
  return {std::ref(*this)};
}

tl::expected<std::reference_wrapper<EBuilder>, std::string> EBuilder::setF(const std::string& str){
  f = tl::make_optional(std::move(str));
  return {std::ref(*this)};
}

tl::expected<EBuilder, std::string> build_expected(
    const std::string& d,
    const std::string& e,
    const std::string& f
){
  auto builder = EBuilder{};
  return builder.setD("hello").and_then(
    [&](auto b){
      return b.get().setD(d);
    }
  ).and_then(
    [&](auto b){
       return b.get().setE(e);
    }
  ).and_then(
    [&](auto b){
       return b.get().setF(f);
    }
  );
}
