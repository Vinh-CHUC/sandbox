#include "patterns/builder/builder.h"

#include <boost/hana.hpp>
#include <cassert>
#include <cwchar>
#include <string>

ABuilder::ABuilder() : x{"default"}, b_builder(), move_count(0) {}
A ABuilder::build() {
  return A{
      .x = std::move(x),
      .b = b_builder.build(),
  };
}

ABuilder &ABuilder::setx(const std::string &s) {
  // IRL one could reuse the other variant by doing
  // return setx(std::string(s)) --> This is rvalue
  x = s;
  return *this;
}
ABuilder &ABuilder::setb_builder(const BBuilder &bb) {
  this->b_builder = bb;
  return *this;
}

ABuilder &ABuilder::setx(std::string &&s) {
  move_count++;
  x = std::move(s);
  return *this;
}
ABuilder &ABuilder::setb_builder(BBuilder &&bb) {
  move_count++;
  this->b_builder = std::move(bb);
  return *this;
}

BBuilder::BBuilder() : x{"default"} {}

B BBuilder::build() {
  return B{
      .x = std::move(x),
  };
}

BBuilder &BBuilder::setx(const std::string &s) {
  x = s;
  return *this;
}

BBuilder &BBuilder::setx(std::string &&s) {
  x = std::move(s);
  return *this;
}

namespace hana = boost::hana;
using namespace hana::literals;

struct Fish {
  std::string name;
};
struct Cat {
  std::string name;
};
struct Dog {
  std::string name;
};

const int TEN = 10;

void test() {
  // Sequences capable of holding heterogeneous objects, and algorithms
  // to manipulate them.
  auto animals = hana::make_tuple(Fish{"Nemo"}, Cat{"Garfield"}, Dog{"Snoopy"});
  auto names = hana::transform(animals, [](auto a) { return a.name; });
  assert(hana::reverse(names) ==
         hana::make_tuple("Snoopy", "Garfield", "Nemo"));

  // No compile-time information is lost: even if `animals` can't be a
  // constant expression because it contains strings, its length is constexpr.
  static_assert(hana::length(animals) == 3u, "");

  // Computations on types can be performed with the same syntax as that of
  // normal C++. Believe it or not, everything is done at compile-time.
  auto animal_types = hana::make_tuple(
      hana::type_c<Fish *>, hana::type_c<Cat &>, hana::type_c<Dog *>);
  auto animal_ptrs = hana::filter(
      animal_types, [](auto a) { return hana::traits::is_pointer(a); });
  static_assert(animal_ptrs ==
                    hana::make_tuple(hana::type_c<Fish *>, hana::type_c<Dog *>),
                "");

  // And many other goodies to make your life easier, including:
  // 1. Access to elements in a tuple with a sane syntax.
  static_assert(animal_ptrs[0_c] == hana::type_c<Fish *>, "");
  static_assert(animal_ptrs[1_c] == hana::type_c<Dog *>, "");

  // 2. Unroll loops at compile-time without hassle.
  std::string s;
  hana::int_c<TEN>.times([&] { s += "x"; });
  // equivalent to s += "x"; s += "x"; ... s += "x";

  // 3. Easily check whether an expression is valid.
  //    This is usually achieved with complex SFINAE-based tricks.
  auto has_name = hana::is_valid([](auto &&x) -> decltype((void)x.name) {});
  static_assert(has_name(animals[0_c]), "");
  static_assert(!has_name(1), "");
}
