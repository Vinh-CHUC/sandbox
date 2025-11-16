# In a BUILD file, e.g. my_project/BUILD
load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension")
load("@rules_python//python:packaging.bzl", "py_wheel")

nanobind_extension(
    name = "nn",
    srcs = ["nn.cpp"],
)

py_wheel(
    name = "nn_wheel",
    distribution = "nn",
    version = "0.1.0",
    deps = [":nn"],
    python_tag = "cp313",  # Your Python version
    abi_tag = "cp313",     # Usually matches python_tag
    platform = "linux_x86_64",  # or manylinux2014_x86_64
)
