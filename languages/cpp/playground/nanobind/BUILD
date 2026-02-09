# In a BUILD file, e.g. my_project/BUILD
load("@nanobind_bazel//:build_defs.bzl", "nanobind_extension", "nanobind_stubgen")
load("@rules_python//python:packaging.bzl", "py_package", "py_wheel")
load("@rules_python//python:pip.bzl", "compile_pip_requirements", "pip_parse")

# Config settings to detect Python version from toolchain
config_setting(
    name = "python_3.13",
    flag_values = {
        "@rules_python//python/config_settings:python_version": "3.13",
    },
)

config_setting(
    name = "python_3.14",
    flag_values = {
        "@rules_python//python/config_settings:python_version": "3.14",
    },
)

# The package ensures that transitive dependencies are also included
# in this case the .so file produced by nanobind_extension
py_package(
    name = "nanobind_playground_pkg",
    deps = [
        "//nanobind/nanobind_playground:nanobind_playground",
    ],
)

py_wheel(
    name = "nanobind_playground_whl",

    # ABI tag tied to Python toolchain version
    abi = select({
        ":python_3.13": "cp313",
        ":python_3.14": "cp314",
        "//conditions:default": "cp313",  # Default to 3.13 as per MODULE.bazel
    }),

    author = "Vinh Chuc",
    author_email = "vinh.chuc@gmail.com",
    classifiers = [
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.13",
        "Programming Language :: Python :: 3.14",
    ],
    description_file = "//nanobind:README.md",
    # Note to self this would be the path to this BUILD file minus /BUILD
    distribution = "nanobind_playground",
    homepage = "https://github.com/Vinh-CHUC/sandbox",
    license = "Proprietary",

    strip_path_prefixes= ["nanobind"],

    # Platform tag based on CPU architecture
    # Using generic linux tag since we're not building in a controlled manylinux environment
    platform = select({
        "@platforms//cpu:aarch64": "linux_aarch64",
        "@platforms//cpu:x86_64": "linux_x86_64",
    }),

    # Python tag tied to Python toolchain version
    python_tag = select({
        ":python_3.13": "cp313",
        ":python_3.14": "cp314",
        "//conditions:default": "cp313",  # Default to 3.13 as per MODULE.bazel
    }),

    # FIXME
    # version = module_version(),
    version = "0.1.0",
    deps = [
        ":nanobind_playground_pkg",
    ],
)
