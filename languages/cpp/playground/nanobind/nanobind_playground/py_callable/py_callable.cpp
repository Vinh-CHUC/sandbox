#include <string>
#include <memory>
#include <unordered_map>

#include <nanobind/nanobind.h>
#include <nanobind/stl/string.h>


namespace nb = nanobind;

class UnboundData{};
struct BoundData{
  std::string str;
  std::string get_str() {return str;}
  void set_str(const std::string& s) {str = s;}
};

// Add checks for whether the key is in the map, throw a python exception if not
struct Callbacks {
  void register_callback(std::string name, nb::callable lambda){
    m_callbacks[name] = lambda;
  };

  nb::object call_callback_0(std::string name){
    try {
      return m_callbacks[name]();
    } catch (const nb::python_error &e){
      nb::str type_name = e.type().attr("__name__");
      if (std::string(type_name.c_str()) != "RuntimeError"){
        throw;
      } else {
        return type_name;
      }
    }
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

  bool call_callback_1_stack_unchanged(std::string name){
    auto data = BoundData();
    auto before = data.get_str();
    m_callbacks[name](data);
    return before == data.get_str(); 
  }

  bool call_callback_1_unique_ptr(std::string name){
    auto data = std::make_unique<BoundData>();
    auto before = data->get_str();
    // Seems that a Python callable can't take a managed ptr to bound class, see relevant Python 
    // test
    m_callbacks[name](data);
    return before == data->get_str(); 
  }

  bool call_callback_1_shared_ptr(std::string name){
    auto data = std::make_shared<BoundData>();
    auto before = data->get_str();
    // Seems that a Python callable can't take a managed ptr to bound class, see relevant Python 
    // test
    m_callbacks[name](data);
    return before == data->get_str(); 
  }

  bool call_callback_1_ptr_changed(std::string name){
    auto data = std::make_unique<BoundData>();
    auto before = data->get_str();
    m_callbacks[name](data.get());
    return before == data->get_str(); 
  }

  private:
    std::unordered_map<std::string, nb::callable> m_callbacks;
};

NB_MODULE(py_callable_ext, m) {
    nb::class_<BoundData>(m, "BoundData")
      .def("get", &BoundData::get_str)
      .def("set", &BoundData::set_str);

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
      .def(
          "call_callback_1_stack_unchanged",
          &Callbacks::call_callback_1_stack_unchanged
      )
      .def("call_callback_1_unique_ptr",
          &Callbacks::call_callback_1_unique_ptr
      )
      .def("call_callback_1_shared_ptr",
          &Callbacks::call_callback_1_shared_ptr
      )
      .def(
          "call_callback_1_ptr_changed",
          &Callbacks::call_callback_1_ptr_changed
      )
      .def("call_callback_2", &Callbacks::call_callback_2)
      .def("call_callback_3", &Callbacks::call_callback_3)
      ;
}
