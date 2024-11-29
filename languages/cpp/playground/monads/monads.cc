#include "monads/monads.h"

EBuilder::EBuilder(): a(""), b(""), c(""){}

EBuilder& EBuilder::setA(std::string && str){
  a = tl::optional<std::string>{std::move(str)};
  return *this;
}

EBuilder& EBuilder::setB(std::string && str){
  b = std::move(str);
  return *this;
}

EBuilder& EBuilder::setC(std::string && str){
  c = std::move(str);
  return *this;
}
