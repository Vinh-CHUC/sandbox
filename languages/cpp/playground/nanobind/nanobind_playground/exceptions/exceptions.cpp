#include <cstddef>
#include <iostream>
#include <memory>
#include <vector>

#include <nanobind/nanobind.h>
#include <nanobind/ndarray.h>
#include <nanobind/stl/vector.h>

namespace nb = nanobind;

class CustomEx : std::exception {
  const char *msg;

public:
  explicit CustomEx(const char *message) noexcept : msg(message) {}

  const char *what() const noexcept override { return msg; }
};

class RichExc : std::exception {
  const char *msg;
  std::vector<int> codes;

public:
  explicit RichExc(const char *message, std::vector<int> codes) noexcept
      : msg(message), codes(std::move(codes)) {}

  std::vector<int> getCodes() const { return codes; }

  const char *what() const noexcept override { return msg; }
};

struct RichExcInfo {
  std::vector<int> codes;

  nb::object get() {
    auto size = codes.size();
    auto buf = std::make_unique_for_overwrite<int[]>(size);
    std::copy(codes.begin(), codes.end(), buf.get());

    nb::capsule owner(buf.release(), [](void *p) noexcept {
      delete[] std::bit_cast<int *>(p);
    });
    return nb::cast(nb::ndarray<int, nb::numpy, nb::ndim<1>, nb::c_contig>(
        owner.data(), {size}, owner));
  };
};

void ThrowValueError() { throw nb::value_error("Some value error"); }

void ThrowCustomEx() { throw CustomEx("Custom exception"); }

void ThrowRichEx() { throw RichExc("Rich exception", {1, 2, 3, 4}); }

NB_MODULE(exceptions_ext, m) {
  m.def("throw_value_error", &ThrowValueError);
  m.def("throw_custom_ex", &ThrowCustomEx);
  m.def("throw_rich_ex", &ThrowRichEx);

  nb::exception<CustomEx>(m, "CustomEx");

  // Naming the exception type to use it in the register_exception_translator
  nb::exception<RichExc> rich_exc(m, "RichExc");

  nb::class_<RichExcInfo>(m, "RichExcInfo").def("get", &RichExcInfo::get);

  nb::register_exception_translator(
      [](const std::exception_ptr &p, void *context) {
        try {
          std::rethrow_exception(p);
        } catch (const RichExc &e) {
          auto exc_t = std::bit_cast<PyObject *>(context);

          auto msg = nb::str(e.what());

          nb::object exc_val = nb::steal(PyObject_CallOneArg(exc_t, msg.ptr()));

          exc_val.attr("info") =
              nb::cast(RichExcInfo{.codes = e.getCodes()}, nb::rv_policy::move);

          PyErr_SetRaisedException(exc_val.release().ptr());
        }
      },
      std::bit_cast<void *>(rich_exc.ptr()));
}
