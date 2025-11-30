#include <vector>

#include <nanobind/ndarray.h>
#include <nanobind/stl/bind_vector.h>

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

NB_MODULE(bind_ext, m) {
    nb::bind_vector<IntVector>(m, "IntVector");
    m.def("double_it", &double_it);
    m.def("double_it_mut", &double_it_mut);
}
