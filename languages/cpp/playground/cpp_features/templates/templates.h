#include <type_traits>

/////////////////////////////////////
// Template Partial Specialisation //
/////////////////////////////////////

struct A {};
struct B {};
template <typename T> struct Base {};

template <typename T> struct Derived : std::integral_constant<int, 0> {};

template <typename T>
struct Derived<T *> : Base<typename T::value>,
                      std::integral_constant<int, 1> {};

static_assert(Derived<int>::value == 0);
// The T::value is not part of the specialisation arguments list so this would
// not trigger SFINAE But rather a hard compiler error
// static_assert(Derived<int*>::value == 1);


// Type Identity
// Note that T does not appear anywhere in the body of Base !
static_assert(!std::is_same_v<Base<A>, Base<B>>);
