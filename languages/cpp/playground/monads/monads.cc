#include "monads/monads.h"

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

tl::expected<EBuilder*, std::string> EBuilder::setD(std::string str){
  d = tl::make_optional(std::move(str));
  return tl::expected<EBuilder*, std::string>(this);
}

tl::expected<EBuilder*, std::string> EBuilder::setE(std::string str){
  e = tl::make_optional(std::move(str));
  return tl::expected<EBuilder*, std::string> {this};
}

tl::expected<EBuilder*, std::string> EBuilder::setF(std::string str){
  f = tl::make_optional(std::move(str));
  return tl::expected<EBuilder*, std::string> {this};
}
