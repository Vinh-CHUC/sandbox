#ifndef FUNCTOR_H
#define FUNCTOR_H

#include <functional>
#include <memory>

template <class T> struct Identity {
  T val;
  Identity(T t): val(t){};
  T& get(){return val;}
};

template <class T> struct Ref {
  std::reference_wrapper<T> val;
  Ref(T t): val(t){};
  T& get(){return val;}
};

template <template <typename...> class F, typename T>
concept ToRef = requires (F<T> r) {
    { r.get() } -> std::same_as<T&>;
};

struct A {};
struct B {};
struct C {};

template <template <typename...> class F> requires ToRef<F, A>
struct MyClass {
  F<A> a;
  F<B> b;
  F<C> c;

  MyClass(F<A> _a, F<B> _b, F<C> _c): a(_a), b(_b), c(_c) {}
};

using MyClassPlain = MyClass<Identity>;
using MyClassRef = MyClass<Ref>;

template <class T> class Functor {
public:
  T val;

  template <typename U> Functor<U> map(std::function<U(T)> func) const {
    return Functor<U>{.val = func(val)};
  };
};

#endif // FUNCTOR_H
