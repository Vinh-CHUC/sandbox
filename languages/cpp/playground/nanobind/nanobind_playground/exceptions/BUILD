load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")

py_library(
    name = "exceptions",
    srcs = ["__init__.py"],
    data = [
        ":exceptions_ext",
    ],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "exceptions_ext",
    srcs = ["exceptions.cpp"],
)
