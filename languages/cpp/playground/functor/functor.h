#ifndef FUNCTOR_H
#define FUNCTOR_H

#include <functional>

template <class T> class Functor {
public:
  T val;

  template <typename U> Functor<U> map(std::function<U(T)> func) const {
    return Functor<U>{.val = func(val)};
  };
};

#endif // FUNCTOR_H
