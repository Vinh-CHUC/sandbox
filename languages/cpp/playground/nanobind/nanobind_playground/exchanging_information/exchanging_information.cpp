#include <vector>
#include <memory>

#include <nanobind/nanobind.h>
#include <nanobind/ndarray.h>
#include <nanobind/stl/vector.h>
#include <nanobind/stl/unique_ptr.h>
#include <nanobind/stl/shared_ptr.h>

namespace nb = nanobind;

using IntVector = std::vector<int>;

IntVector double_it(const IntVector &in) {
    IntVector out(in.size());
    for (size_t i = 0; i < in.size(); ++i)
        out[i] = in[i] * 2;
    return out;
}

void double_it_mut(IntVector &in) {
    for (auto& val: in){
      val *= 2;
    }
}

nb::list double_it_py(nb::list l) {
  nb::list result;
  for (nb::handle h: l){
    result.append(h * nb::int_(2));
  }
  return result;
}

struct Data {};
Data data;
Data *get_data() { return &data; }

struct A {
  Data &b(){ return data;}
};

NB_MODULE(exchanging_information_ext, m) {
    m.def("double_it", &double_it);
    m.def("double_it_mut", &double_it_mut);
    m.def("double_it_py", &double_it_py);

    auto ownership_m = m.def_submodule("ownership_ext", "");

    nb::class_<Data>(ownership_m, "Data");

    // Python will incorrectly try to get ownership of the pointer (non-heap)
    ownership_m.def("kaboom", &get_data);

    // take_ownership is actually the default for pointer return values
    //
    // THIS IMPLIES THAT THE C++ HAS TO RELINQUISH OWNERSHIP (NOT ALLOWED TO DESTRUCT THE INSTANCE)
    ownership_m.def("make_data",[]{return new Data();}, nb::rv_policy::take_ownership);

    // copy is default for lvalue references
    ownership_m.def("make_data", &A::b, nb::rv_policy::copy);

    // nanobind::rv_policy::reference
    // No ownership from Python, CAN BE DANGEROUS IF C++ DELETES IT
    
    // rv_policy:automatic_reference
    // Same as automatic
    // BUT uses reference for pointer types
    
    //// unique_ptr ////
    
    ownership_m.def("create_uptr", [](){ return std::make_unique<Data>();});
    ownership_m.def("consume_uptr", [](std::unique_ptr<Data> x){});

    ownership_m.def("create_sptr", [](){return std::make_shared<Data>();});
    ownership_m.def(
      "receive_sptr", [](std::shared_ptr<Data> data){
        return data.use_count();
      }
    );

    ownership_m.def("receive_callback_and_call", [](nb::callable callable){
      return callable();
    });

    ownership_m.def("ping_pong", [](nb::object obj){
      return obj;
    });
}
