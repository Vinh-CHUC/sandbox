#ifndef BUILD_ERROR_TESTER_H
#define BUILD_ERROR_TESTER_H

#include <string>
#include <type_traits>

namespace testing {

template <template <typename...> class F, typename T, typename = void>
struct ConstExprTester {
  static const bool is_valid = false;
};

template <template <typename...> class F, typename T>
struct ConstExprTester<F, T,
                       std::void_t<std::integral_constant<T, F<T>::call()>>> {
  static const bool is_valid = true;
};

template <typename T> struct A {
  constexpr static T call() {
    T t1{}, t2{};
    return t1 * t2;
  };
};

constexpr int NINE = A<int>::call();
static_assert(NINE == 0);

static_assert(ConstExprTester<A, int>::is_valid);
/* static_assert(!ConstExprTester<A, std::string>::is_valid); */

} // namespace testing

#endif
