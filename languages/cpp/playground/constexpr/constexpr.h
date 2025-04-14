#ifndef CONSTEXPR_H
#define CONSTEXPR_H

#include <array>
#include <type_traits>
#include <vector>

constexpr int ONE = 1;
constexpr int TWO = 2;

///////////////////////////////////////////////
// Some kind of SFINAE based testing utility //
///////////////////////////////////////////////

template<typename T, T(*F)(), typename = void>
struct ConstExprTester {
  static const bool is_valid = false;
};

template <typename T, T(*F)()>
struct ConstExprTester<T, F, std::void_t<std::integral_constant<T, F()>>> {
    static constexpr bool is_valid = true;
};

constexpr int one(){
  return ONE;
}

int two(){
  return TWO;
}

constexpr std::vector<int> vec_builder(){
  return std::vector<int>{};
}

constexpr std::array<int, TWO> arr_builder(){
  return std::array<int, TWO>{ONE, TWO};
}

// one() is a constexpr function
using A = ConstExprTester<int, &one>;
static_assert(A::is_valid);

// two() is not a constexpr function
using B = ConstExprTester<int, &two>;
static_assert(!B::is_valid);

// Heap allocated objects aren't allowed
using C = ConstExprTester<std::vector<int>, &vec_builder>;
static_assert(!C::is_valid);

// Arrays are
using D = ConstExprTester<std::array<int, TWO>, &arr_builder>;
static_assert(D::is_valid);

//////////////////////////////////////////////////////////////////////////
// Why trying to directly evaluate F() as a template arg would not work //
//////////////////////////////////////////////////////////////////////////

template<typename T, T t>
struct ConstExprTester2 {
  static const bool is_valid = false;
};

// This simply doesn't build at all as two() is not a constexpr and this is passed directly
/* using E = std::integral_constant<int, two()>; */


// This doesn't work, somehow void_t helps make things more lazy
/* template <typename T, T(*F)()> */
/* struct ConstExprTester<T, F, std::integral_constant<T, F()>> { */
/*     static constexpr bool is_valid = true; */
/* }; */


// This would always work provided that F() is a function of the right type (regardless of
// constexpr-ness)
// Because decltype only deduces the type of F(), it does not attempt to evaluate it, which is why
// constexpr-ness is irrelevant
/* template <typename T, T(*F)()> */
/* struct ConstExprTester<T, F, std::void_t<decltype(F())>> { */
/*     static constexpr bool is_valid = true; */
/* }; */

#endif // CONSTEXPR_H
