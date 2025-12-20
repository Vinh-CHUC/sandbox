
load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")

py_library(
    name = "back_and_forth",
    srcs = ["__init__.py"],
    data = [
        ":back_and_forth_ext",
    ],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "back_and_forth_ext",
    srcs = ["back_and_forth.cpp"],
    visibility = ["//visibility:public"]
)

nanobind_stubgen(
    name = "back_and_forth_stubgen",
    module = ":back_and_forth_ext",
)
