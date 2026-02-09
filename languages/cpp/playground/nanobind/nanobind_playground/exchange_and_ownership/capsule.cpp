#include <nanobind/nanobind.h>
#include <memory>
#include <iostream>

namespace nb = nanobind;

struct Data { };

NB_MODULE(capsule_ext, m) {
    m.def("make_owning_capsule", []() {
      auto ptr = std::make_unique<Data>();
      return nb::capsule(ptr.release(), [](void *p) noexcept {
          delete static_cast<Data *>(p);
      });
    });

    m.def("make_coowning_capsule", []() {
      auto ptr = std::make_unique<Data>();
      return nb::capsule(ptr.get(), [](void *p) noexcept {
          delete static_cast<Data *>(p);
      });
    });

    m.def("make_coowning_capsule_noret", []() {
      auto ptr = std::make_unique<Data>();
      auto capsule = nb::capsule(ptr.get(), [](void *p) noexcept {
          delete static_cast<Data *>(p);
      });
    });

    m.def("capsule_cleanup_is_not_python_only", [](){
      static bool deleted = false;
      auto ptr = std::make_unique<Data>();
      {
        nb::capsule capsule(ptr.get(), [](void *p) noexcept {
            deleted = true;
            delete static_cast<Data *>(p);
        });
      }
      // To avoid double free
      ptr.release();
      return deleted;
    });
}
