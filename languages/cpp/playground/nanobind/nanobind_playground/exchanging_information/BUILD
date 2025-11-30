load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")

py_library(
    name = "exchanging_information",
    srcs = ["__init__.py"],
    data = [
        ":exchanging_information_ext",
        ":bind_ext"
    ],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "exchanging_information_ext",
    srcs = ["exchanging_information.cpp"],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "bind_ext",
    srcs = ["bind.cpp"],
    visibility = ["//visibility:public"]
)

nanobind_stubgen(
    name = "exchanging_information_stub",
    module = ":exchanging_information_ext",
)
