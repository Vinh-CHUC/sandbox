#ifndef FUNCTOR_H
#define FUNCTOR_H

#include <functional>
#include <memory>

template <class T> using Identity = T;

struct A {};
struct B {};
struct C {};

template <template <typename...> class F>
struct MyClass {
  F<A> a;
  F<B> b;
  F<C> c;
};

using MyClassPlain = MyClass<Identity>;
using MyClassSharedPtr = MyClass<std::shared_ptr>;

template <class T> class Functor {
public:
  T val;

  template <typename U> Functor<U> map(std::function<U(T)> func) const {
    return Functor<U>{.val = func(val)};
  };
};

#endif // FUNCTOR_H
