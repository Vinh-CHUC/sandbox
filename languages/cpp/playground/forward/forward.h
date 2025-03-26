#ifndef FORWARD_H
#define FORWARD_H

#include <type_traits>
#include <utility>
enum class RefType {
  lref,
  rref,
  error
};

template <class T>
RefType doSomething(T&& x){
  if constexpr (std::is_lvalue_reference_v<T&&>){
    return RefType::lref;
  } else if constexpr (std::is_rvalue_reference_v<T&&>){
    return RefType::rref;
  } else {
    return RefType::error;
  }
}

template <class T>
RefType wrapper(T&& x) {
    // Preserving "lvalue-ness" or "rvalue-ness"
    return doSomething(x);
};

template <class T>
RefType forwarding_wrapper(T&& x) {
    // Preserving "lvalue-ness" or "rvalue-ness"
    return doSomething(std::forward<T>(x));
};

template<typename T>
constexpr T&&
myforward(typename std::remove_reference<T>::type& t) noexcept
{ return static_cast<T&&>(t); }

template<typename T>
constexpr T&&
myforward(typename std::remove_reference<T>::type&& t) noexcept
{
  static_assert(
      !std::is_lvalue_reference<T>::value,
      "std::forward must not be used to convert an rvalue to an lvalue"
  );
  return static_cast<T&&>(t);
}

#endif // FORWARD_H
