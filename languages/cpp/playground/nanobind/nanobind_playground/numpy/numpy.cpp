#include <iostream>

#include <nanobind/ndarray.h>

namespace nb = nanobind;

using RGBImage = nb::ndarray<uint8_t, nb::shape<-1, -1, 3>, nb::device::cpu>;

NB_MODULE(numpy_ext, m) {
  m.def("inspect", [](const nb::ndarray<>& a) {
      std::cout << "Array dimension: " << a.ndim() << std::endl;
      std::cout << "Array data pointer: " << a.data() << std::endl;

      for (size_t i = 0; i < a.ndim(); ++i) {
        std::cout << "Array dimension " << a.shape(i) << std::endl;
        std::cout << "Array stride " << a.stride(i) << std::endl;
      }

      std::cout << "Device ID = " << a.device_id() << std::endl;
      std::cout << "  CPU = " << (a.device_type() == nb::device::cpu::value) << std::endl;
      std::cout << "  GPU = " << (a.device_type() == nb::device::cuda::value) << std::endl;

      std::cout
        << "Array type: int16_t = " << (a.dtype() == nb::dtype<int16_t>()) << " ,"
        << "uint32_t= " << (a.dtype() == nb::dtype<uint32_t>()) << " ,"
        << "float64= " << (a.dtype() == nb::dtype<double>()) << " ,"
        << "float=" << (a.dtype() == nb::dtype<float>()) << std::endl;
  });


  m.def("process", [](RGBImage data) {
      // Double brightness of the MxNx3 RGB image
      for (size_t y = 0; y < data.shape(0); ++y)
          for (size_t x = 0; x < data.shape(1); ++x)
              for (size_t ch = 0; ch < 3; ++ch)
                  data(y, x, ch) = (uint8_t) std::min(255, data(y, x, ch) * 2);
  });
}
