load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")

py_library(
    name = "nanobind_playground",
    srcs = ["__init__.py"],
    deps = [
        "//nanobind/nanobind_playground/numpy:numpy",
        "//nanobind/nanobind_playground/exchanging_information:exchanging_information"
    ],
    data = [":nn_ext"],
    imports = [".."],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "nn_ext",
    srcs = ["nn.cpp"],
)

nanobind_stubgen(
    name = "nn_ext_stubgen",
    module = ":nn_ext",
)
