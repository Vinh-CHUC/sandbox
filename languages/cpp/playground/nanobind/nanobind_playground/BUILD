load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")

py_library(
    name = "nanobind_playground",
    srcs = ["__init__.py"],
    data = [":nn_ext"],
    visibility = ["//visibility:public"]
)

nanobind_extension(
    name = "nn_ext",
    srcs = ["nn.cpp"],
)

nanobind_stubgen(
    name = "nn_stubgen",
    module = ":nn_ext",
    marker_file = "src/py.typed",
    output_directory = "src",
    recursive=True,
)
