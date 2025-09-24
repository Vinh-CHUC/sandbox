#ifndef FORWARD_H
#define FORWARD_H

#include <type_traits>
#include <utility>
enum class RefType { lref, rref, error };

namespace basic {

template <class T> RefType doSomething(T &&x) {
  if constexpr (std::is_lvalue_reference_v<T &&>) {
    return RefType::lref;
  } else if constexpr (std::is_rvalue_reference_v<T &&>) {
    return RefType::rref;
  } else {
    return RefType::error;
  }
}

template <class T> RefType wrapper(T &&x) {
  // Preserving "lvalue-ness" or "rvalue-ness"
  return doSomething(x);
};

template <class T> RefType forwarding_wrapper(T &&x) {
  // Preserving "lvalue-ness" or "rvalue-ness"
  return doSomething(std::forward<T>(x));
};

} // namespace basic

namespace forward {

template <class T> RefType doSomething(T &&x) {
  if constexpr (std::is_lvalue_reference_v<T &&>) {
    return RefType::lref;
  } else if constexpr (std::is_rvalue_reference_v<T &&>) {
    return RefType::rref;
  } else {
    return RefType::error;
  }
}

template <class T> RefType forwarding_wrapper(T &&x) {
  // Preserving "lvalue-ness" or "rvalue-ness"
  return doSomething(static_cast<T &&>(x));
};

} // namespace forward

#endif // FORWARD_H
