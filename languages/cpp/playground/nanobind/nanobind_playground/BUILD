load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")

py_library(
    name = "nanobind_playground",
    srcs = ["__init__.py"],
    deps = [
        "//nanobind/nanobind_playground/numpy:numpy",
        "//nanobind/nanobind_playground/exchange_and_ownership:exchange_and_ownership",
        "//nanobind/nanobind_playground/py_callable:py_callable"
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
