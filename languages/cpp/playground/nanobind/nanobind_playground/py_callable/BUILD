
load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")

py_library(
    name = "py_callable",
    srcs = ["__init__.py"],
    data = [
        ":py_callable_ext",
    ],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "py_callable_ext",
    srcs = ["py_callable.cpp"],
    visibility = ["//visibility:public"]
)

nanobind_stubgen(
    name = "py_callable_stubgen",
    module = ":py_callable_ext",
)
