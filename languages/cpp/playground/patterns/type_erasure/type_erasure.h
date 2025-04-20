#include <string>
// Intent of the pattern
// Structural subtyping + dynamic polymorphism
// Similar to Rust's dyn trait, combined with blanket implementations

namespace Basic {
// Achieves:
// - A pointer to a single base (non-templated) can wrap any T!
// - No explicit relationship between Base and T, some kind of structural subtyping

struct A {
  virtual std::string foo() = 0;
  virtual ~A() {}
};

template<typename T>
struct Derived: A {
  T t;
  Derived(T _t): t(_t){}

  std::string foo() override {return t.foo();}
};

}
