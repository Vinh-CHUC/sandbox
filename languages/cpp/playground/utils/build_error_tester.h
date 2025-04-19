#ifndef BUILD_ERROR_TESTER_H
#define BUILD_ERROR_TESTER_H

#include <string>
#include <type_traits>

namespace testing {

template<template <typename ...> class F, typename T, typename = void>
struct ConstExprTester {
  static const bool is_valid = false;
};

template<template <typename ...> class F, typename T>
struct ConstExprTester<F, T, std::void_t<std::integral_constant<T,  std::integral_constant<int, 3>()     >>> {
    static constexpr bool is_valid = true;
};

template<typename T>
struct A {
  constexpr T operator()() const noexcept{
      T t1{}, t2{};
      return t1 * t2;
  };
};


static_assert(ConstExprTester<A, int>::is_valid);
/* static_assert(!ConstExprTester<std::string, foo<std::string>>::is_valid); */

}

#endif
