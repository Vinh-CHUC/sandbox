load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")

py_library(
    name = "numpy",
    srcs = ["__init__.py"],
    data = [":numpy_ext"],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "numpy_ext",
    srcs = ["numpy.cpp"],
    visibility = ["//visibility:public"]
)

nanobind_stubgen(
    name = "numpy_ext_stubgen",
    module = ":numpy_ext",
)
