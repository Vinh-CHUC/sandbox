#include <string>
#include <memory>
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

namespace Better {

class Entity {
  struct EntityConcept {
    virtual std::string speak() = 0;
    virtual int id() = 0;
  };

  template <typename T>
  struct EntityImpl: EntityConcept {
    T t;

    std::string speak() final{
      return t.speak();
    }

    virtual int id(){
      return t.id();
    }

    EntityImpl(T t): t(t){}
  };

  std::unique_ptr<EntityConcept> ptr;

  public:

  template <typename T>
  Entity(const T t): ptr(std::make_unique<EntityImpl<T>>(t)){}
};

}
