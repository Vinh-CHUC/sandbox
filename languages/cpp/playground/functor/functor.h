#ifndef FUNCTOR_H
#define FUNCTOR_H

#include <functional>
#include <memory>

template <class T> using Identity = T;
template <class T> using Ref = std::reference_wrapper<T>;

struct A {};
struct B {};
struct C {};

template <template <typename...> class F>
struct MyClass {
  F<A> a;
  F<B> b;
  F<C> c;

  MyClass(F<A> a, F<B> b, F<C> c);
};

using MyClassPlain = MyClass<Identity>;
using MyClassRef = MyClass<Ref>;

template<> MyClass<Identity>::MyClass(A _a, B _b, C _c): a(_a), b(_b), c(_c) {}

template<> MyClass<Ref>::MyClass(Ref<A> _a, Ref<B> _b, Ref<C> _c): a(_a), b(_b), c(_c) {}

template <class T> class Functor {
public:
  T val;

  template <typename U> Functor<U> map(std::function<U(T)> func) const {
    return Functor<U>{.val = func(val)};
  };
};

#endif // FUNCTOR_H
