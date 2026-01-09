#include <string>
#include <unordered_map>

#include <nanobind/nanobind.h>
#include <nanobind/stl/string.h>


namespace nb = nanobind;

class UnboundData{};
class BoundData{};

// Add checks for whether the key is in the map, throw a python exception if not
struct Callbacks {
  void register_callback(std::string name, nb::callable lambda){
    m_callbacks[name] = lambda;
  };

  nb::object call_callback_0(std::string name){
    return m_callbacks[name]();
  }

  nb::object call_callback_1(std::string name, nb::object arg1){
    return m_callbacks[name](arg1);
  }

  nb::object call_callback_2(std::string name, nb::object arg1, nb::object arg2){
    return m_callbacks[name](arg1, arg2);
  }

  nb::object call_callback_3(std::string name, nb::object arg1, nb::object arg2, nb::object arg3){
    return m_callbacks[name](arg1, arg2, arg3);
  }

  nb::object call_callback_1_with_unbound_cpp(std::string name){
    return m_callbacks[name](UnboundData());
  }

  nb::object call_callback_1_with_bound_cpp(std::string name){
    return m_callbacks[name](BoundData());
  }

  private:
    std::unordered_map<std::string, nb::callable> m_callbacks;
};

NB_MODULE(py_callable_ext, m) {
    nb::class_<BoundData>(m, "BoundData");

    nb::class_<Callbacks>(m, "Callbacks")
      .def(nb::init<>())
      .def("register_callback", &Callbacks::register_callback)
      .def("call_callback_0", &Callbacks::call_callback_0)
      .def("call_callback_1", &Callbacks::call_callback_1)
      .def(
          "call_callback_1_with_unbound_cpp",
          &Callbacks::call_callback_1_with_unbound_cpp
      )
      .def(
          "call_callback_1_with_bound_cpp",
          &Callbacks::call_callback_1_with_bound_cpp
      )
      .def("call_callback_2", &Callbacks::call_callback_2)
      .def("call_callback_3", &Callbacks::call_callback_3)
      ;
}
