#include <nanobind/nanobind.h>
#include <Python.h>
#include <cstdint>

namespace nb = nanobind;

NB_MODULE(refcount_ext, m) {
    // Returns a new list (refcount 1) as a raw uintptr_t to avoid nanobind conversion
    m.def("get_new_list_ptr", []() -> uintptr_t {
        return reinterpret_cast<uintptr_t>(PyList_New(0));
    });

    // Returns a borrowed reference to an existing object as uintptr_t
    m.def("get_borrowed_ptr", [](nb::handle h) -> uintptr_t {
        return reinterpret_cast<uintptr_t>(h.ptr());
    });

    // Manually increment refcount
    m.def("manual_incref", [](nb::handle h) {
        Py_INCREF(h.ptr());
    });

    // Manually decrement refcount
    m.def("manual_decref", [](nb::handle h) {
        Py_DECREF(h.ptr());
    });

    // Get current refcount
    m.def("get_refcount", [](nb::handle h) {
        return Py_REFCNT(h.ptr());
    });

    // Test nb::steal - takes a raw pointer as uintptr_t
    m.def("wrap_steal", [](uintptr_t p) {
        return nb::steal(reinterpret_cast<PyObject*>(p));
    });

    // Test nb::borrow - takes a raw pointer as uintptr_t
    m.def("wrap_borrow", [](uintptr_t p) {
        return nb::borrow(reinterpret_cast<PyObject*>(p));
    });

    m.def("borrow_refcount", []() {
      auto l = nb::steal(PyList_New(0));
      auto borrowed = nb::borrow(l);
      return Py_REFCNT(borrowed.ptr());
    });

    // This is not very deterministic
    m.def("underflow_steal", []() {
      // The large integer is to avoid thigns being cached
      // A small enough ints are kind of static that aren't freed?
      PyObject *p = PyLong_FromLong(1000000000);

      PyObject *q = nullptr;

      {
          nb::object a = nb::steal(p);
          nb::object b = nb::steal(p);
          q = b.ptr();
      }

      PyObject_Repr(q);

      // PyObject *p2 = PyLong_FromLong(1000000000);
      // Py_DECREF(p2);
      // Py_DECREF(p2);
    });
}
