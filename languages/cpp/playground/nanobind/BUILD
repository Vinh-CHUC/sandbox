# In a BUILD file, e.g. my_project/BUILD
load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")
load("@rules_python//python:packaging.bzl", "py_package", "py_wheel")

nanobind_extension(
    name = "nn_ext",
    srcs = ["nn.cpp"],
)

py_library(
    name = "nanobind_playground",
    srcs = ["//nanobind/src/nanobind_playground:__init__.py"],
    data = [":nn_ext"]
)

# The package ensures that transitive dependencies are also included
# in this case the .so file produced by nanobind_extension
py_package(
    name = "nanobind_playground_pkg",
    packages = ["nanobind_playground"],
    deps = [":nanobind_playground"],
)


nanobind_stubgen(
    name = "nn_stubgen",
    module = ":nn_ext",
    marker_file = "src/py.typed",
    output_directory = "src",
    recursive=True,
)

py_wheel(
    name = "nanobind_playground_whl",

    # This is more informational right? The source of truth is more about the python toolchain in
    # MODULE.bazel?
    abi = "cp313",

    author = "Vinh Chuc",
    author_email = "vinh.chuc@gmail.com",
    classifiers = [
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.13",
    ],
    description_file = "//nanobind:README.md",
    # Note to self this would be the path to this BUILD file minus /BUILD
    distribution = "nanobind_playground",
    homepage = "https://github.com/Vinh-CHUC/sandbox",
    license = "Proprietary",

    # These two are more informational?
    platform = "manylinux2014_x86_64",
    python_tag = "cp313",

    # FIXME
    # version = module_version(),
    version = "0.1.0",
    deps = [
        ":nanobind_playground_pkg",
    ],
)
